'use client';

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}:{
    error: Error & { digest?: string};
    reset: () => void;
}) {
    useEffect(()=>{
        // Optionally log the error to an error reporting service
        console.log(error);
    }, [error]);

    return(
        <main className="flex flex-col h-screen items-center justify-center">
            <h2 className="text-center">Somethong went wrong!</h2>
            <button 
            className="bg-blue-600 rounded-md m-4 px-4 py-2 cursor-pointer text-sm text-white transition-colors hover:bg-blue-400"
            // Attempt to recover by trying to re-render the invoices route
            onClick={()=> reset()}
            >Try again</button>
        </main>
    );

}