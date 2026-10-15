import { createContext, useContext, useState, type ReactNode } from 'react';

interface FormProviderContextValue {
    value: string;
    setvalue: (value: string) => void;
}

const FormProviderContext = createContext<FormProviderContextValue | undefined>(
    undefined
);

export function FormProviderProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [value, setvalue] = useState<string>("");

    return (
        <FormProviderContext.Provider value={{ value, setvalue }}>
            {children}
        </FormProviderContext.Provider>
    );
}

export function useFormProvider() {
    const context = useContext(FormProviderContext);
    if (context === undefined) {
        throw new Error(
            'useFormProvider must be used within a FormProviderProvider'
        );
    }
    return context;
}
