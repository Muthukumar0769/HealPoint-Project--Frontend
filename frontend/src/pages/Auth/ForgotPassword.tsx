import { useState } from "react";
import { FaArrowLeft, FaEnvelope, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";


type Step="email"|"otp"|"reset";

export const ForgotPassword = () => {
    const[step,setStep]=useState<Step>("email");
    const[showPassword,setShowPassword]=useState(false);
    const[showConfirmPassword,setShowConfirmPassword]=useState(false);
    const[otp,setOtp]=useState(["","","","","",""]);

    const handleOtpChange=(value:string,index:number)=>{
        if(!/^[0-9]?$/.test(value)) return;
        const newOtp=[...otp];
        newOtp[index]=value;
        setOtp(newOtp);
    }
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-blue-100 p-8">
            {step==="email" && (
                <>
                <Link to="/login" className="flex items-center gap-2 text-sm mb-10 cursor-pointer text-gray-700"><FaArrowLeft/> Back To Login</Link>
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl">
                      <FaLock/>
                    </div>
                    <h1 className="text-3xl font-bold mt-6">Forgot Password?</h1>
                    <p className="text-gray-600 mt-4 leading-7"> Enter your registered email address and we’ll send you an OTP to
                       reset your password.</p>
                </div>
                <form className="mt-10 space-y-6">
                    <div>
                        <label className="block mb-3 font-medium text-gray-700">Email Address</label>
                        <div className="h-14 border border-gray-300 rounded-xl px-4 flex items-center focus-within:border-blue-600">
                            <FaEnvelope className="text-gray-400"/>
                            <input type="email" placeholder="Enter Your Email" className="h-full w-full outline-none px-4"/>
                        </div>
                    </div>
                    <button type="button" onClick={()=>setStep("otp")} className="w-full h-14 bg-blue-600 hover:bg-blue-700 cursor-pointer font-semibold text-white rounded-xl">Send OTP</button>
                </form>
                </>
            )}

            {step==="otp" && (
                <>
                <button className="flex items-center gap-2 cursor-pointer text-sm mb-10 text-gray-700" 
                onClick={()=>setStep("email")}><FaArrowLeft/> Back</button>
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl">
                      <FaEnvelope/>
                    </div>
                    <h1 className="text-3xl font-bold mt-6"> Verify OTP</h1>
                    <p className="text-gray-600 mt-4 leading-7">We have sent a 6-digit OTP to your email address.</p>
                    </div>
                    <div className="flex justify-center gap-3 mt-10">
                        {otp.map((digit,index)=>(
                            <input key={index} value={digit} maxLength={1} onChange={(e)=>handleOtpChange(e.target.value,index)}
                                    className="w-12 h-14 border border-gray-300 text-center text-xl font-semibold rounded-lg outline-none focus:bg-blue-600 "/>
                        ))}
                    </div>
                    <p className="text-center text-sm mt-6 text-gray-600">Didn't Receive OTP?{" "} <button className="text-blue-600 font-medium">Resend in 00.25</button></p>
                    <button type="button" onClick={()=>setStep("reset")} className="w-full h-14 mt-5 bg-blue-600 hover:bg-blue-700 cursor-pointer font-semibold text-white rounded-xl">Verify OTP</button>
                </>
            )}

             {step==="reset" && (
                <>
                <button className="flex items-center gap-2 text-sm mb-10 text-gray-700 cursor-pointer" 
                onClick={()=>setStep("otp")}><FaArrowLeft/> Back</button>
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl">
                      <FaLock/>
                    </div>
                    <h1 className="text-3xl font-bold mt-6"> Reset Password</h1>
                    <p className="text-gray-600 mt-4 leading-7">Create a new password for your account.</p>
                    </div>
                    <form className="mt-10 space-y-6">
                    <div>
                        <label className="block mb-3 font-medium text-gray-700">New Password</label>
                        <div className="h-14 border border-gray-300 rounded-xl px-4 flex items-center focus-within:border-blue-600">
                            <FaLock className="text-gray-400"/>
                            <input type={showPassword?"text":"password"} placeholder="Enter Password" className="h-full w-full outline-none px-4"/>
                            <button type="button" onClick={()=>setShowPassword(!showPassword)}>
                                {showPassword?<FaEyeSlash/>:<FaEye/>}
                            </button>
                        </div>
                    </div>
                     <div>
                        <label className="block mb-3 font-medium text-gray-700">Confirm Password</label>
                        <div className="h-14 border border-gray-300 rounded-xl px-4 flex items-center focus-within:border-blue-600">
                            <FaLock className="text-gray-400"/>
                            <input type={showConfirmPassword?"text":"password"} placeholder="Enter Password" className="h-full w-full outline-none px-4"/>
                            <button type="button" onClick={()=>setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword?<FaEyeSlash/>:<FaEye/>}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">Reset Password</button>
                    </form>
        
    </>
  )}
  </div>
  </div>
  )
}
