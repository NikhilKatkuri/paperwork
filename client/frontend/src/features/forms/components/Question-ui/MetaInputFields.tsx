import React from 'react';
import RichTextInput from './RichTextInput';

function MetaInputFeilds() {
    return (
       <div className="w-full">
         <div className="bg-theme-form-container before:bg-theme-form-container-border/0 focus-within:before:bg-theme-form-container-border after:bg-theme-form-container-active relative h-full w-full overflow-hidden rounded-xl p-3 pt-3 before:absolute before:top-0 before:left-0 before:z-10 before:h-full before:w-2 before:rounded-l-xl before:transition-all before:duration-200 before:ease-in-out after:absolute after:top-0 after:left-0 after:z-10 after:h-2 after:w-full after:rounded-t-xl after:transition-all after:duration-200 after:ease-in-out after:content-['']">
            <RichTextInput placeholder="Untitled Form" textSize="heading" />
            <RichTextInput
                placeholder="Form description"
                textSize="normal"
                allowLists={true}
            />
        </div>
       </div>
    );
}

export default MetaInputFeilds;
