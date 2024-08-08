"""

 OMRChecker

 Author: Udayraj Deshmukh
 Github: https://github.com/Udayraj123

"""
import os
from csv import QUOTE_NONNUMERIC
from pathlib import Path
from time import time
import io

import cv2
import pandas as pd
import numpy as np
from rich.table import Table
from pdf2image import convert_from_bytes, convert_from_path

from src import constants
from src.defaults import CONFIG_DEFAULTS
from src.evaluation import EvaluationConfig, evaluate_concatenated_response
from src.logger import console, logger
from src.template import Template
from src.utils.file import Paths, setup_dirs_for_paths, setup_outputs_for_template
from src.utils.image import ImageUtils
from src.utils.interaction import Stats
from src.utils.parsing import get_concatenated_response, open_config_with_defaults

# Load processors
STATS = Stats()


def entry_point(input_dir, args):
    if not os.path.exists(input_dir):
        raise Exception(f"Given input directory does not exist: '{input_dir}'")
    curr_dir = input_dir
    return process_dir(input_dir, curr_dir, args)

def process_dir(
    omr_files,
    args,
    template=None,
    tuning_config=CONFIG_DEFAULTS,
    evaluation_config=None,
):

    # Update local template (in current recursion stack)
    local_template_path = Path(constants.TEMPLATE_FILENAME)
    template = Template(
        local_template_path,
        tuning_config,
    )

    output_dir = Path(args["output_dir"])
    paths = Paths(output_dir)

    local_evaluation_path = os.path.join(constants.DATA_DIR, constants.EVALUATION_FILENAME)
    if not args["setLayout"] and os.path.exists(local_evaluation_path):
        evaluation_config = EvaluationConfig(
            local_evaluation_path,
            template,
            tuning_config,
        )

    if omr_files:

        setup_dirs_for_paths(paths)
        outputs_namespace = setup_outputs_for_template(paths, template)

        if args["setLayout"]:
            show_template_layouts(omr_files, template, tuning_config)
        else:
            return process_files(
                omr_files,
                args['input_paths'][0],
                template,
                tuning_config,
                evaluation_config,
                outputs_namespace,
            )

    else:
        # Directory should have images
        logger.info(
            f"No valid images found"
        )


def show_template_layouts(omr_files, template, tuning_config):
    for file_path in omr_files:
        file_name = file_path.name
        file_path = str(file_path)
        in_omr = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
        in_omr = template.image_instance_ops.apply_preprocessors(
            file_path, in_omr, template
        )
        # template_layout = template.image_instance_ops.draw_template_layout(
        #     in_omr, template, shifted=False, border=2
        # )
        # InteractionUtils.show(
        #     f"Template Layout: {file_name}", template_layout, 1, 1, config=tuning_config
        # )


def process_files(
    omr_files,
    input_path,
    template,
    tuning_config,
    evaluation_config,
    outputs_namespace,
):
    start_time = int(time())
    files_counter = 0
    STATS.files_not_moved = 0

    response = {'valid': [], 'error': [], 'multi': []}
    for file in omr_files:
        files_counter += 1
        file_path = file.filename
        file_name = os.path.basename(file_path)

        # in_omr = cv2.imread(str(file_path), cv2.IMREAD_GRAYSCALE)
        # images = convert_from_bytes(file.read())
        
        images = convert_from_path(input_path+'/'+str(file_path))
        with io.BytesIO() as output:
            images[0].save(output, format="PNG")
            file_bytes = output.getvalue()
        
        image_array = np.frombuffer(file_bytes, dtype=np.uint8)
        in_omr = cv2.imdecode(image_array, cv2.IMREAD_GRAYSCALE)

        logger.info("")
        logger.info(
            f"({files_counter}) Opening image: \t'{file_path}'\tResolution: {in_omr.shape}"
        )

        template.image_instance_ops.reset_all_save_img()

        template.image_instance_ops.append_save_img(1, in_omr)

        in_omr = template.image_instance_ops.apply_preprocessors(
            file_path, in_omr, template
        )

        if in_omr is None:
            # Error OMR case
            new_file_path = outputs_namespace.paths.errors_dir.joinpath(file_name)
            outputs_namespace.OUTPUT_SET.append(
                [file_name] + outputs_namespace.empty_resp
            )
            if check_and_move(
                constants.ERROR_CODES.NO_MARKER_ERR, file_path, new_file_path
            ):
                err_line = [
                    file_name,
                    file_path,
                    new_file_path,
                    "NA",
                ] + outputs_namespace.empty_resp
                pd.DataFrame(err_line, dtype=str).T.to_csv(
                    outputs_namespace.files_obj["Errors"],
                    mode="a",
                    quoting=QUOTE_NONNUMERIC,
                    header=False,
                    index=False,
                )
                err_line[2] = str(err_line[2])
                response["error"].append(err_line)
            continue

        # uniquify
        file_id = str(file_name)
        file_id = file_id.replace(".pdf", ".jpg")
        save_dir = outputs_namespace.paths.save_marked_dir
        (
            response_dict,
            final_marked,
            multi_marked,
            _,
        ) = template.image_instance_ops.read_omr_response(
            template, image=in_omr, name=file_id, save_dir=save_dir
        )

        # TODO: move inner try catch here
        # concatenate roll nos, set unmarked responses, etc
        omr_response = get_concatenated_response(response_dict, template)

        if (
            evaluation_config is None
            or not evaluation_config.get_should_explain_scoring()
        ):
            logger.info(f"Read Response: \n{omr_response}")

        score = 0
        if evaluation_config is not None:
            score = evaluate_concatenated_response(omr_response, evaluation_config)
            logger.info(
                f"(/{files_counter}) Graded with score: {round(score, 2)}\t for file: '{file_id}'"
            )
        else:
            logger.info(f"(/{files_counter}) Processed file: '{file_id}'")

        # if tuning_config.outputs.show_image_level >= 2:
            # InteractionUtils.show(
            #     f"Final Marked Bubbles : '{file_id}'",
            #     ImageUtils.resize_util_h(
            #         final_marked, int(tuning_config.dimensions.display_height * 1.3)
            #     ),
            #     1,
            #     1,
            #     config=tuning_config,
            # )

        resp_array = []
        for k in template.output_columns:
            resp_array.append(omr_response[k])

        outputs_namespace.OUTPUT_SET.append([file_name] + resp_array)

        if multi_marked == 0 or not tuning_config.outputs.filter_out_multimarked_files:
            STATS.files_not_moved += 1
            new_file_path = save_dir.joinpath(file_id)
            # Enter into Results sheet-
            results_line = [file_name, file_path, new_file_path, score] + resp_array
            # Write/Append to results_line file(opened in append mode)
            pd.DataFrame(results_line, dtype=str).T.to_csv(
                outputs_namespace.files_obj["Results"],
                mode="a",
                quoting=QUOTE_NONNUMERIC,
                header=False,
                index=False,
            )
            results_line[2] = str(results_line[2])
            response["valid"].append(results_line)
        else:
            # multi_marked file
            logger.info(f"[{files_counter}] Found multi-marked file: '{file_id}'")
            new_file_path = outputs_namespace.paths.multi_marked_dir.joinpath(file_name)
            if check_and_move(
                constants.ERROR_CODES.MULTI_BUBBLE_WARN, file_path, new_file_path
            ):
                mm_line = [file_name, file_path, new_file_path, "NA"] + resp_array
                pd.DataFrame(mm_line, dtype=str).T.to_csv(
                    outputs_namespace.files_obj["MultiMarked"],
                    mode="a",
                    quoting=QUOTE_NONNUMERIC,
                    header=False,
                    index=False,
                )
                mm_line[2] = str(mm_line[2])
                response["multi"].append(mm_line)
            # else:
            #     TODO:  Add appropriate record handling here
            #     pass

    print_stats(start_time, files_counter, tuning_config)
    return response


def check_and_move(error_code, file_path, filepath2):
    # TODO: fix file movement into error/multimarked/invalid etc again
    STATS.files_not_moved += 1
    return True


def print_stats(start_time, files_counter, tuning_config):
    time_checking = max(1, round(time() - start_time, 2))
    log = logger.info
    log("")
    log(f"{'Total file(s) moved':<27}: {STATS.files_moved}")
    log(f"{'Total file(s) not moved':<27}: {STATS.files_not_moved}")
    log("--------------------------------")
    log(
        f"{'Total file(s) processed':<27}: {files_counter} ({'Sum Tallied!' if files_counter == (STATS.files_moved + STATS.files_not_moved) else 'Not Tallying!'})"
    )

    if tuning_config.outputs.show_image_level <= 0:
        log(
            f"\nFinished Checking {files_counter} file(s) in {round(time_checking, 1)} seconds i.e. ~{round(time_checking/60, 1)} minute(s)."
        )
        log(
            f"{'OMR Processing Rate':<27}:\t ~ {round(time_checking/files_counter,2)} seconds/OMR"
        )
        log(
            f"{'OMR Processing Speed':<27}:\t ~ {round((files_counter * 60) / time_checking, 2)} OMRs/minute"
        )
    else:
        log(f"\n{'Total script time':<27}: {time_checking} seconds")

    if tuning_config.outputs.show_image_level <= 1:
        log(
            "\nTip: To see some awesome visuals, open config.json and increase 'show_image_level'"
        )
