import { useState } from 'react';
import FolderUpload from './FolderUpload';
import classNames from 'classnames';
import axios from 'axios';
import AnswerKey from './AnswerKey';

interface EvaluationResult {
    error: [] | [][]
    multi: [] | [][]
    valid: [] | [][]
}

const Home = () => {

    const [files, setFiles] = useState<File[]>([]);
    const [result, setResult] = useState<EvaluationResult>()
    const [pagedValidResult, setPagedValidResult] = useState<[]| [][]>()
    const [page, setPage] = useState<number>(1)
    const [answerKey, setAnswerKey] = useState<Array<string>>(Array(50).fill("F"))
    const [progress, setProgress] = useState<number>(0)

    const pageSize=10

    const handleFilesSelected = (files: File[]) =>{
        setFiles(files)
        if(files.length===0) {
            setResult(undefined)
            setProgress(0)
        }
    }

    const createAnswerKey = (answers: string[], update: boolean)=> {
        console.log(answers)
        setAnswerKey(answers)
        if(update) {
            axios.post('http://localhost:8080/api/createAnswerKey', answers).then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.error("There was an error!", error);
                });
        }
    }

    const changePage = (pageNumber: number) => {
        if(!(pageNumber<1 || pageNumber>Math.ceil(files.length/pageSize))){
            setPage(pageNumber)
            setPagedValidResult(result?.valid.slice((pageNumber-1)*pageSize,Math.min(pageNumber*pageSize, files.length)))
        }
    } 

    async function calculateProgress(items: number) {
        for (let i = 0; i < items; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setProgress(Math.floor(100*i/items))
        }
        setProgress(0)
      }

    const evaluate = () => {
        const formData = new FormData()
        files.forEach(file => {
            formData.append('files', file)
        });

        setResult(undefined)
        setPagedValidResult(undefined)
        setPage(1)
        setProgress(0)
        calculateProgress(files.length)

        axios.post<EvaluationResult>('http://localhost:8080/api/evaluate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => {
                setResult(response.data)
                setPagedValidResult(response.data.valid.slice(0, page*pageSize))
            })
            .catch(error => {
                console.error("There was an error!", error)
            });
    };

    const downloadEvaluation = ()=>{
        axios({
            url: 'http://localhost:8080/api/evaluationReport',
            method: 'GET',
            responseType: 'blob'
        }).then((response) => {
            const href = URL.createObjectURL(response.data);

            const link = document.createElement('a');
            link.href = href;
            link.setAttribute('download', 'Evaluation_Report.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
        });
    }
    
  return (
    <div className='w-screen'>
        <div className="m-6 p-6 bg-white border border-gray-200 rounded-lg shadow">
            <div className='font-bold underline text-lg'>Step 1: Create answer key for evaluation </div>
            <AnswerKey onAnswersSelected={createAnswerKey}></AnswerKey>
        </div>
        <div className="m-6 p-6 bg-white border border-gray-200 rounded-lg shadow">
            <div className='font-bold underline text-lg'>Step 2: Select the directory containing OMR sheets for evaluation</div>
            <FolderUpload onFilesSelected={handleFilesSelected}></FolderUpload>
            <div>
                {progress!==0 ? (
                    <div className='mx-auto w-min rounded-md py-2 px-4 border-0 font-semibold bg-[#D8F1A0BB]'>Evaluating...</div>
                ): (
                    <button className={classNames('rounded-md py-2 px-4 border-0 font-semibold', {'bg-gray-100 text-slate-300': files.length===0, 'bg-[#D8F1A0BB] hover:bg-[#D8F1A0]': files.length>0})} onClick={evaluate}>Start evaluation</button>
                )}
            </div>
        </div>
        <div className="m-6 p-6 bg-white border border-gray-200 rounded-lg shadow">
        <div className='font-bold underline text-lg'>Step 3: View evaluation results</div>
            { files.length>0 && result ? ( <div className="px-10 py-10">
                <div className='w-full float-right mb-2'>
                    <button className='rounded-md py-2 text-sm float-right px-4 border-0 font-semibold  bg-[#D8F1A0BB] hover:bg-[#D8F1A0]' onClick={downloadEvaluation}>Download CSV</button>
                </div>
                <div className="mt-2 relative border-2 border-slate-400 overflow-x-auto rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-xs border-b text-gray-700 uppercase bg-[#D8F1A038]">
                            <tr className='rounded-lg text-base border-b-2 border-slate-400 divide-x divide-slate-600'>
                                <th scope="col" className="text- text-nowrap px-6 py-3">
                                    #
                                </th>
                                <th scope="col" className="text- text-nowrap px-6 py-3">
                                    OMR Sheet
                                </th>
                                <th scope="col" className="text-nowrap px-6 py-3">
                                    Score
                                </th>
                                <th scope="col" className="text-nowrap px-6 py-3">
                                    Mobile Number
                                </th>
                                <th scope="col" className="text-nowrap px-6 py-3">
                                    Student Name
                                </th>
                                <th scope="col" className="text-nowrap px-6 py-3">
                                    Roll Number
                                </th>
                                <th scope="col" className="text-nowrap px-6 py-3">
                                    Gender
                                </th>
                                {Array.from({ length: 50 }, (_, index) => (
                                    <th scope="col" className="px-6 py-3">
                                        Q{index+1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedValidResult?.map((row, index) => (
                                <tr className="bg-white border divide-x hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(page-1)*pageSize+index+1}
                                    </td>
                                    {row.map((item, colIndex) => (
                                        [1,2].includes(colIndex) ? (<></>) : (
                                            <td key={colIndex} className={classNames('px-6 py-4 whitespace-nowrap',
                                                {'text-red-700':colIndex>5 && item!==answerKey[colIndex-6], 'text-green-700':colIndex>5 && item===answerKey[colIndex-6]}
                                            )}>
                                                {item}
                                            </td>
                                        )
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4" aria-label="Table navigation">
                    <span className="text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full md:inline md:w-auto">Showing <span className="font-semibold text-gray-900">{(page-1)*pageSize+1}-{Math.min(page*pageSize, files.length)}</span> of <span className="font-semibold text-gray-900">{files.length}</span></span>
                    <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700" onClick={()=>changePage(page-1)}>Previous</a>
                        </li>
                        <li>
                            <a href="#" aria-current="page" className="flex items-center justify-center px-3 h-8 text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">{page}</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700" onClick={()=>changePage(page+1)}>Next</a>
                        </li>
                    </ul>
                </nav> 
            </div>) : (
                <div className='p-10'>
                    <div className="w-full bg-gray-200 rounded-full">
                        <div className="bg-[#D8F1A0BB] font-medium text-center leading-none rounded-full]" style={{width: progress + '%'}}> {progress}% </div>
                    </div>
                </div>
            )
        }
        </div>
    </div>
  );
}

export default Home;