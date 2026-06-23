import React, { createContext, useState, useContext } from 'react';

interface DemoContextType {
    isDemoMode: boolean;
    setIsDemoMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDemoMode, setIsDemoMode] = useState(true);

    return (
        <DemoContext.Provider value={{ isDemoMode, setIsDemoMode }}>
            {children}
        </DemoContext.Provider>
    );
};

export const useDemoContext = () => {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error('useDemoContext must be used within a DemoProvider');
    }
    return context;
};
