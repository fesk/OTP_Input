# OTP_Input
JS/HTML UI widget for entering OTP tokens of varying length (e.g. TOTP, SMS), auto-progression, fires custom event etc.

One Time Pad input widget, for entering numeric OTP codes (e.g. TOTP, sent-via-SMS), automatic progression between fields, raises a custom "complete" event when all fields contain a number where the 'detail' property includes property "otp_token" which is the value entered. Also allows paste (pointer/[ctrl|cmd]-v), and left-arrow or backspace to move back to previous fields

e.g.;

```
let tot=new OTP_Input();
tot.render(document.getElementById('otp_container_div'));
tot.instance.addEventListener('complete',function(e){
     console.log(e.detail);
})
```

See code for documentation, or look at example.html for a functional example;


![image](https://github.com/fesk/OTP_Input/assets/6652072/9493f342-7d8e-4387-bc15-d1b3a3c4252c)



No warranty or guarantee of any kind. All using plain old-fashioned javascript.

