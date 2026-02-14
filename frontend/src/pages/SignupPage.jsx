import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/Authcontext"; 
import { Mail, Lock, User, Phone, Shield, Briefcase, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import justiceBg from "../assets/justice-bg.jpg";

const SignupPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState("citizen");
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signup } = useAuth();

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await signup(data.email, data.password, data.fullName, selectedRole, data.phone);
            toast.success("Account created! Redirecting...");
            
            const routes = { police: "/police-dashboard", lawyer: "/legal-dashboard" };
            navigate(routes[selectedRole] || "/dashboard");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FFFAF0] font-sora">
            
            {/* LEFT SIDE: BRANDING */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 overflow-hidden">
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1.05, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-cover bg-[center_top]"
                    style={{ backgroundImage: `url(${justiceBg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/90 via-[#0B1120]/80 to-[#0B1120]/95"></div>

                <div className="relative z-10 mt-10">
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-6xl font-bold text-white mb-8 leading-tight tracking-tight"
                    >
                        Bridging Citizens <br /> to 
                        <span className="text-orange-500 ml-4">Justice</span>
                    </motion.h1>

                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="border-l-4 border-orange-500 pl-6"
                    >
                        <p className="text-slate-200 text-lg max-w-md font-medium leading-relaxed">
                            Secure. Transparent. Accessible legal support for citizens, police, and lawyers.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 flex items-center gap-3 text-[10px] tracking-[0.3em] text-slate-500 uppercase font-semibold">
                    <div className="h-px w-8 bg-slate-700"></div>
                    © 2026 NyayaSahayak • Official Government Initiative
                </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Create your account
                        </h2>
                        <p className="mt-4 text-slate-600 text-lg font-medium">
                            Already have one? <Link to="/login" className="text-orange-600 font-semibold hover:text-orange-700 hover:underline decoration-2 underline-offset-4 transition-colors">Sign in here</Link>
                        </p>
                    </div>

                    {/* ROLE SELECTOR */}
                    <div className="grid grid-cols-3 gap-4">
                        <RoleCard 
                            icon={<User size={20} />} 
                            label="Citizen" 
                            selected={selectedRole === "citizen"} 
                            onClick={() => setSelectedRole("citizen")}
                        />
                        <RoleCard 
                            icon={<Shield size={20} />} 
                            label="Police" 
                            selected={selectedRole === "police"} 
                            onClick={() => setSelectedRole("police")}
                        />
                        <RoleCard 
                            icon={<Briefcase size={20} />} 
                            label="Lawyer" 
                            selected={selectedRole === "lawyer"} 
                            onClick={() => setSelectedRole("lawyer")}
                        />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {[
                            { name: "fullName", label: "Full Name", type: "text", icon: <User />, placeholder: "John Doe" },
                            { name: "email", label: "Email Address", type: "email", icon: <Mail />, placeholder: "name@email.com" },
                            { name: "phone", label: "Phone Number (For SOS)", type: "tel", icon: <Phone />, placeholder: "+91 98765 43210" },
                            { name: "password", label: "Password", type: "password", icon: <Lock />, placeholder: "••••••••" }
                        ].map((field) => (
                            <div key={field.name} className="group">
                                <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3 block">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                        {React.cloneElement(field.icon, { size: 18 })}
                                    </div>
                                    <input 
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        {...register(field.name, { required: true })}
                                        className="w-full h-14 pl-12 pr-4 bg-white border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900"
                                    />
                                </div>
                            </div>
                        ))}

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-14 bg-[#0B1120] hover:bg-black text-white font-bold text-lg rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl shadow-slate-300"
                        >
                            {isLoading ? "Processing..." : "Create Account"}
                            {!isLoading && <ArrowRight size={18} />}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

const RoleCard = ({ icon, label, selected, onClick }) => (
    <motion.div 
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative cursor-pointer h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden group ${
            selected 
            ? "border-orange-500 bg-orange-50/50 shadow-md" 
            : "border-slate-100 bg-white hover:border-orange-300 hover:shadow-md"
        }`}
    >
        {selected && (
            <motion.div layoutId="activeRole" className="absolute inset-0 border-2 border-orange-500 rounded-2xl" />
        )}
        <div className={`transition-colors ${selected ? "text-orange-600" : "text-slate-400 group-hover:text-slate-600"}`}>{icon}</div>
        <span className={`text-xs font-bold uppercase tracking-tight ${selected ? "text-orange-700" : "text-slate-600"}`}>
            {label}
        </span>
    </motion.div>
);

export default SignupPage;