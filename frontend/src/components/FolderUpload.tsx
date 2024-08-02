import React, { useRef, useState } from 'react';
import { FiFilePlus } from "react-icons/fi";
import { FaRegCheckCircle } from "react-icons/fa";

interface FolderUploadProps {
  onFilesSelected: (files: File[]) => void;
}

declare module "react" {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        webkitdirectory?: string;
    }
}

const FolderUpload: React.FC<FolderUploadProps> = ({ onFilesSelected }) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles).filter(file => file.type === 'application/pdf')
      setFiles(filesArray);
      onFilesSelected(filesArray);
    }
  };

  const resetFiles = () => {
    setFiles([]);
    onFilesSelected([]);
  }

  const triggerFileInput = () => {
    if(files.length === 0) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div>
        <div className='flex h-48 border-2 border-dashed rounded-sm m-10 justify-center place-items-center hover:cursor-pointer' onClick={triggerFileInput}>
            <div className='grid'>
                {files.length>0 ? (
                    <>
                        <div className='flex justify-center'>
                            <FaRegCheckCircle className='grid-row-1 h-12 w-12 stroke-1 stroke-green-100'/>
                        </div>
                        <div className='pt-5'>
                            <h6 className="mb-2 text-2xl tracking-tight text-gray-900 grid-rows-2">{files.length} files selected </h6>
                        </div>
                        <div>
                            <button className='rounded-full py-1 w-1/2 border-0 text-sm bg-red-300' onClick={resetFiles}>Reset</button>
                        </div>
                    </>
                ): (
                    <>
                        <div className='flex justify-center'>
                            <FiFilePlus className='grid-row-1 h-12 w-12 stroke-1'/>
                        </div>
                        <div className='pt-5'>
                            <h6 className="mb-2 text-2xl tracking-tight text-gray-900 grid-rows-2">Click here to select the directory containing OMR sheets</h6>
                        </div>
                        <input type="file" className="hidden" webkitdirectory='true' onChange={handleFolderUpload}
                        ref={fileInputRef}/>
                    </>
                )}
            </div>
        </div>
      
    </div>
  );
};

export default FolderUpload;