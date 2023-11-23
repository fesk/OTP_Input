//- otp_input.js - Copyright (c) 2023, Nick Besant hwf@fesk.net. All rights reserved.
//- licenced under GPLv3, see LICENCE.txt
(function(){

    OTP_Input = function(opts){
        //- Copyright (c) 2023, Nick Besant hwf@fesk.net. All rights reserved.
        //- licenced under GPLv3, see LICENCE.txt

        // One Time Pad input widget, for entering numeric OTP codes (e.g. TOTP, sent-via-SMS), automatic
        // progression between fields, raises a custom "complete" event when all fields contain a number
        // where the 'detail' property includes property "otp_token" which is the value entered.
        // Also allows paste (pointer/[ctrl|cmd]-v), and left-arrow or backspace to move back to previous fields
        //
        //  let tot=new OTP_Input();
        //  tot.render(document.getElementById('otp_container_div'));
        //  tot.instance.addEventListener('complete',function(e){
        //      console.log(e.detail);
        //  })
        //
        // See code for documentation.
        //
        // No warranty or guarantee of any kind. All using plain old-fashioned javascript.
        //

        // ########## OPTIONS #############
        // Use these like;
        // let tot=new OTP_Input({option: value});
        //
        // include an inline <style> declaration for this, or style it yourself instead, just use the defaults to
        // render with <style>, create your own then set this to false.
        this.include_inline_style=true;
        // Customise the three below styles for the container box, input fields and placeholder.
        this.box_style="padding:0 4px 0 4px;align-content:center;width:1em;border:1px solid lavender;border-radius: 3px;";
        this.container_style="display: flex;font-size: 2em;";
        this.placeholder_style="content:attr(data-placeholder);pointer-events: none;display: block;color:lightblue;"
        // Text to use as placeholder (same shown on each box)
        this.placeholder="0";
        // number of input fields (numbers) needed
        this.fields=6;
        // Set focus to first field when rendering is done
        this.focus_on_render=true;
        // Automatically attach events to this rendered instance to handle progression, paste, completion
        // etc.  Note if you set this to false it won't do anything at all.
        this.attach_events=true;
        // ########## END OPTIONS #############

        let myinstance;  // for use in event handlers
        this.instance=null;

        if(opts){
            for(let o in opts){
                if(opts.hasOwnProperty(o)){
                    // override defaults with any options set
                    if(o==='include_inline_style'){this.include_inline_style=opts[o]}
                    if(o==='box_style'){this.box_style=opts[o]}
                    if(o==='container_style'){this.container_style=opts[o]}
                    if(o==='placeholder_style'){this.placeholder_style=opts[o]}
                    if(o==='fields'){this.fields=opts[o]}
                    if(o==='placeholder'){this.placeholder=opts[o]}
                    if(o==='focus_on_render'){this.focus_on_render=opts[o]}
                    if(o==='attach_events'){this.attach_events=opts[o]}
                    if(o==='no_tabindex_in_header'){this.no_tabindex_in_header=opts[o]}
                }
            }
        }

        this.log = function(t){
            // override this if needed
            console.log('TOTP_Input: '+t);
        }

        this.render = function(parent,classes){
            // render the UI components;
            //   parent: optional, either a string or an Element to append to.  If empty the body will be used.
            //   classes: optional, if given must be an Array of string class names to add to the container.
            if(this.instance!==null){
                // we're not designed to handle tracking multiple rendered instances
                this.log("Already rendered.  Create a new instance if you want another one.");
                return;
            }

            let prnt;
            if(classes===null||classes===undefined){
                classes=['totp-enter'];
                if(!classes instanceof Array){
                    this.log("Argument 'classes' is not an array");
                    return;
                }
                classes.push('totp-enter');
            }else{
                classes=['totp-enter'];
            }

            if(parent){
                if(parent instanceof String){
                    prnt = document.querySelector(parent);
                }else{
                    prnt = parent;
                }
            }else{
                prnt=document.body;
                this.log("'parent' missing or not an element, appending to document body");
            }
            if(prnt===null) {
                this.log("Parent for render is nil, or doesn't exist: " + parent)
                throw "OTP_Input.render: parent nil"
            }
            if(this.include_inline_style){
                let mystyle=document.createElement('style');
                mystyle.innerText=".totp-enter{display: flex;font-size: 2em;}" +
                                  ".totp-char{padding:0 4px 0 4px;align-content:center;width:1em;border:1px solid lavender;border-radius: 3px;}" +
                                  ".totp-char:empty:before{content:attr(data-placeholder);pointer-events: none;display: block;color:lightblue;}";
                prnt.appendChild(mystyle);
            }
            let container=document.createElement('div');
            container.setAttribute('role', "input");
            container.setAttribute('aria-label', "Numeric input boxes for OTP tokens of "+this.fields+" numbers.");
            for(let x=0;x<classes.length;x++){container.classList.add(classes[x]);}
            for(let x=0;x<this.fields;x++){
                let box=document.createElement('div');
                box.classList.add('totp-char');
                box.setAttribute('contenteditable', true);
                box.setAttribute('data-placeholder', this.placeholder);
                box.setAttribute('data-val', x+1);
                box.setAttribute('aria-label', "Number at position "+(x+1)+" of token.");
                container.appendChild(box);
            }
            prnt.appendChild(container);
            this.instance=container;
            if(this.focus_on_render){
                container.firstElementChild.focus();
            }
            if(this.attach_events){
                container.addEventListener('keyup',this._progress);
                container.addEventListener('paste',this._onpaste);
            }
            myinstance=this;
        }

        this._progress = function(e){
            // Handle keypress in fields; progress to next/move back/finish
            let me=e.target.closest('.totp-char');
            // is ctrl or meta (macos) pressed - basic check, e.g. user is ctrl-v or cmd-v for paste
            if(e.ctrlKey||e.metaKey){
                return;
            }
            if(me){
                let myindex=parseInt(me.getAttribute('data-val')),myparent=me.closest('.totp-enter');
                if (e.keyCode>=48&&e.keyCode<=57) {
                    // number has been entered
                    if (myindex === myinstance.fields) {
                        // on last input box
                        me.innerText=String.fromCharCode(e.keyCode);
                        // we're possibly done - raise the complete event if we have the requisite amount of numbers
                        myinstance.completed();
                    } else {
                        // got a number, move focus to next input box
                        myparent.querySelector('.totp-char[data-val="' + (myindex + 1) + '"]').focus();
                    }

                }else if (e.keyCode>=65&&e.keyCode<=90){
                    // it's not a number, so just reset the current box back to empty and don't move on
                    me.innerText='';
                }else if(e.keyCode===8){
                    // backspace
                    if(myindex>1){
                        me.innerText='';
                        myparent.querySelector('.totp-char[data-val="'+(myindex-1)+'"]').focus();
                    }else{
                        me.innerText='';
                    }
                }else if(e.keyCode===37){
                    // left arrow
                    if(myindex>1){
                        myparent.querySelector('.totp-char[data-val="'+(myindex-1)+'"]').focus();
                    }
                } else if(e.keyCode===39){
                    // right arrow
                    if(myindex<myinstance.fields){
                        myparent.querySelector('.totp-char[data-val="'+(myindex+1)+'"]').focus();
                    }
                }
            }
            if(me.innerText.length>0){
                // handle when multiple keys have been pressed at once - e.g. someone mashed 23 instead of 2, just
                // take first one (might not be valid but something needed to be done).
                me.innerText=me.innerText[0];
            }
        }

        this.clear = function(){
            // clear all content out and set focus to first input box
            let boxes=this.instance.querySelectorAll('.totp-char');
            for(let x=0;x<boxes.length;x++){
                boxes[x].innerText='';
            }
            this.instance.firstElementChild.focus();
        }

        this.get = function(){
            // get the current value, only includes non-empty inputs
            let boxes=this.instance.querySelectorAll('.totp-char'),myval='';
            for(let x=0;x<boxes.length;x++){
                let valt=boxes[x].innerText;
                if(valt){
                    myval+=valt;
                }
            }
            return myval;
        }

        this.set = function(token) {
            // set boxes to current value. if 'token' is too long, raise an error.  If it's empty do nothing
            // except warn.
            if(token===null||token.length===0){
                this.log('Set content: nothing given, ignoring');
                return;
            }
            if(token.length>this.fields){
                throw "OTP_Input.set: token given is longer than field count "+this.fields;
            }
            for(let x=0;x<this.fields;x++){
                this.instance.querySelector('.totp-char[data-val="'+(x+1)+'"]').innerText=token[x];
            }
            this.completed();
        }

        this.completed = function(){
            let myval='';
            for(let x=0;x<this.fields;x++){
                let valt=this.instance.querySelector('.totp-char[data-val="' + (x + 1) + '"]').innerText;
                if(valt){
                    myval+=valt;
                }
            }
            // check the total amount of numbers entered is sufficient
            if(myval.length===this.fields){
                let completed = new CustomEvent("complete",
                    { bubbles: true,
                        detail: {otp_token: myval} });
                this.instance.dispatchEvent(completed);
            }
        }

        this._onpaste = function(e){
            // handle paste event, e.g. from [cmd/ctrl]-v or pointer paste.
            let me=e.target,myparent=me.closest('.totp-enter'),
                cpcontent=e.clipboardData.getData("text");
            if(cpcontent.length===1){
                // if it's a single number, we'll do nothing (just return), otherwise empty the box
                if(cpcontent.charCodeAt(0)<65&&cpcontent.charCodeAt(0)>90){
                    e.preventDefault();
                }
            }else if(cpcontent.length===myinstance.fields){
                // the pasted data is the same length as the amount of numbers we need to complete
                // is it a string of (fields) numbers?
                for(let x=0;x<myinstance.fields;x++){
                    let thischar=cpcontent.charCodeAt(x);
                    if(thischar<65&&thischar>90){
                        // not a number, empty box and return
                        e.preventDefault();
                        return;
                    }
                }
                // assume OK and is X digits.  Replace all input box content with content from paste
                for(let x=1;x<myinstance.fields+1;x++){
                    myparent.querySelector('.totp-char[data-val="'+x+'"]').innerText=cpcontent[x-1];
                }
                e.preventDefault();
                myparent.querySelector('.totp-char[data-val="' + myinstance.fields + '"]').focus();

                myinstance.completed();

            }else{
                // don't want it
                e.preventDefault();
            }
        }
    }


})();
