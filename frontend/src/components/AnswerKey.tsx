import React, { useEffect, useState } from 'react';
import AnswerInput from './AnswerInput';
import axios from 'axios';
import { FaRegCheckCircle } from "react-icons/fa";

interface Args {
    onAnswersSelected: (answers: string[], update: boolean) => void
}

const AnswerKey: React.FC<Args> = ({onAnswersSelected}) => {
    
    const [answerKey, setAnswerKey] = useState(Array(50).fill("F"))
    const [answerKeyFlag, setAnswerKeyFlag] = useState<boolean>()
    const [updatedAnswerKeyFlag, setUpdatedAnswerKeyFlag] = useState<boolean>(false)

    useEffect(() => {
        const initFunction = () => {
          axios.get<Array<string>>('http://localhost:5000/api/answerKey').then(response => {
                    setAnswerKey(response.data)
                    setAnswerKeyFlag(true)
                    onAnswersSelected(response.data, false)
                })
                .catch(error => {
                    setAnswerKeyFlag(false)
                });
        };
    
        initFunction();
      }, [])

    const optionSelected = (option: string, id: number) => {
        answerKey[id-1] = option
        setAnswerKey(answerKey)
        setUpdatedAnswerKeyFlag(true)
    }

    const saveAnswerKey = ()=>{
        setUpdatedAnswerKeyFlag(false)
        setAnswerKeyFlag(true)
        onAnswersSelected(answerKey, true)
    }

    if(answerKeyFlag===undefined){
        return <div>Loading...</div>;
    }

  return (
    <div>
        <div className="grid grid-rows-10 grid-flow-col gap-4 m-10">
            {Array.from({ length: 50 }, (_, index) => (
                <div className='px-5'>
                    {answerKeyFlag? (
                        <AnswerInput index={index+1}  answer={answerKey[index]} onOptionClick={optionSelected}></AnswerInput>
                    ): (
                        <AnswerInput index={index+1} onOptionClick={optionSelected}></AnswerInput>
                    )}
                </div>
            ))}
        </div>
        
        <div className='flex justify-center items-center'>
            {answerKeyFlag? (
                updatedAnswerKeyFlag ? (
                    <button className='rounded-md py-2 px-4 border-0 font-semibold bg-[#D8F1A0BB] hover:bg-[#D8F1A0]' onClick={saveAnswerKey}>Update answer key
                    </button>
                ): (
                    <div className='rounded-md py-2 px-4 border-0 font-semibold bg-[#D8F1A0BB]'>{updatedAnswerKeyFlag ? 'Update answer key': (
                        <div className="flex items-center">
                            <FaRegCheckCircle className='h-4 w-4 mr-2 '/> Saved
                        </div>)}
                    </div>
                )
            ):(
                <button className='rounded-md py-2 px-4 border-0 font-semibold bg-[#D8F1A0BB] hover:bg-[#D8F1A0]' onClick={saveAnswerKey}>Save answer key
                </button>
            ) }
        </div>
    </div>
  );
}

export default AnswerKey;