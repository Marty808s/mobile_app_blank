import { addContent, getFeedsAndContent } from '../db/db';
import { createContext, useContext, useState, useEffect } from 'react';
import { useCallback } from 'react';

const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [updateInterval, setUpdateInterval] = useState(10000);

    const [nextUpdate, setNextUpdate] = useState(null);

    const calcNextUpdate = useCallback(() => {
        const nextUpdate = new Date(lastUpdate.getTime() + updateInterval);
        setNextUpdate(nextUpdate);
        return nextUpdate;
    }, [lastUpdate, updateInterval]);


    useEffect(() => {
        if (isUpdating) {
            calcNextUpdate();
        }
    }, [isUpdating, calcNextUpdate]);


    // Spuštění automatického intervalu
    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('_____UpdateService_____');
            console.log('Tato funkce se spouští každých 10 sekund');
            setIsUpdating(true);
            setLastUpdate(new Date());
            getFeedsAndContent();
        }, updateInterval);

        return () => clearInterval(intervalId); // Cleanup
    }, [updateInterval]);

    return (
        <UpdateContext.Provider value={{
            isUpdating,
            lastUpdate,
            nextUpdate,
            updateInterval,
        }}>
            {children}
        </UpdateContext.Provider>
    );
}

export const useUpdateService = () => {
    return useContext(UpdateContext);
}

