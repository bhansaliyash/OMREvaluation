import classNames from 'classnames';
import { useEffect, useState } from 'react';

interface Args {
    index: number,
    answer?: string,
    onOptionClick: (option: string, index: number) => void
}

const AnswerInput = (props: Args) => {
    
    const [optionSelected, setOptionSelected] = useState<string>();

    useEffect(() => {
        const initFunction = () => {
            if(props.answer){
                setOptionSelected(props.answer)
            }
        };
    
        initFunction();
      }, [])

    const selectOption = (option: string) => {
        setOptionSelected(option)
        props.onOptionClick(option, props.index)
    }

  return (
    <div className="grid grid-rows-1 grid-cols-6">
        <div>{props.index}.</div>
        <div className={classNames('w-2/3 text-xs rounded-full border-black border-2 hover:cursor-pointer', {'bg-[#35C06FA0]': optionSelected==="A", 'bg-gray-100':optionSelected!=="A"})} onClick={() => selectOption("A")}>A</div>
        <div className={classNames('w-2/3 text-xs rounded-full border-black border-2 hover:cursor-pointer', {'bg-[#35C06FA0]': optionSelected==="B", 'bg-gray-100':optionSelected!=="B"})} onClick={() => selectOption("B")}>B</div>
        <div className={classNames('w-2/3 text-xs rounded-full border-black border-2 hover:cursor-pointer', {'bg-[#35C06FA0]': optionSelected==="C", 'bg-gray-100':optionSelected!=="C"})} onClick={() => selectOption("C")}>C</div>
        <div className={classNames('w-2/3 text-xs rounded-full border-black border-2 hover:cursor-pointer', {'bg-[#35C06FA0]': optionSelected==="D", 'bg-gray-100':optionSelected!=="D"})} onClick={() => selectOption("D")}>D</div>
        <div className={classNames('w-2/3 text-xs rounded-full border-black border-2 hover:cursor-pointer', {'bg-[#35C06FA0]': optionSelected==="E", 'bg-gray-100':optionSelected!=="E"})} onClick={() => selectOption("E")}>E</div>
    </div>
  );
}

export default AnswerInput;