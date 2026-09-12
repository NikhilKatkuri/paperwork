import React from 'react';
import RichTextInput from './RichTextInput';

function MetaInputFeilds() {
    return (
        <div className="bg-theme-form-container before:bg-theme-form-container-border/0 focus-within:before:bg-theme-form-container-border after:bg-theme-form-container-active relative w-full rounded-xl p-3 before:absolute before:top-0 before:left-0 before:h-full before:w-2 before:rounded-xl before:transition-all before:duration-200 before:ease-in-out after:absolute after:top-0 after:left-0 after:h-2 after:w-full after:rounded-t-xl after:content-[''] after:z-10 after:transition-all after:duration-200 after:ease-in-out overflow-hidden pt-3"> 
            <RichTextInput placeholder="Untitled Form" textSize="heading" />
            <RichTextInput
                placeholder="Form description"
                textSize="normal"
                allowLists={true}
            />
        </div>
    );
}

export default MetaInputFeilds;
