import React, { useState, useEffect } from "react";
import { Siren, X, MapPin, AlertTriangle, Loader2, CheckCircle2, Crosshair, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/Authcontext";

const EmergencyModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [type, setType] = useState("police"); 
  const [topic, setTopic] = useState(""); // <--- NEW STATE FOR TOPIC
  const [description, setDescription] = useState(""); 
  const [isSending, setIsSending] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [location, setLocation] = useState({ 
    lat: null, 
    lng: null, 
    display: "Waiting for location..." 
  });

  const navigate = useNavigate();

  const detectLocation = () => {
    setIsLocating(true);
    setLocation(prev => ({ ...prev, display: "Detecting GPS signal..." }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = position.coords.accuracy;
          
          setLocation({
            lat: lat,
            lng: lng,
            display: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (±${Math.round(acc)}m)`
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          setLocation({ lat: null, lng: null, display: "Location access denied. Using fallback." });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocation({ lat: null, lng: null, display: "Geolocation not supported." });
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSending(false);
      setTopic(""); // Reset topic
      setDescription("");
      detectLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!location.lat) {
      alert("Waiting for location... Please click 'Locate Me' if it takes too long.");
      return;
    }
    
    // Validation: Ensure topic is filled if it's a police emergency
    if (type === 'police' && !topic.trim()) {
      alert("Please specify the topic (e.g., Theft, Assault).");
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('emergencies')
        .insert([
          {
            user_id: user?.id,
            type: type === 'police' ? 'Police Intervention' : 'Medical Assistance',
            topic: topic || (type === 'police' ? 'General Police Alert' : 'Medical Emergency'), // <--- SAVE TOPIC
            status: 'active',
            priority: 'critical',
            location_lat: location.lat,
            location_lng: location.lng,
            location_address: location.display,
            description: description || "Immediate assistance required.",
            reporter_name: user?.user_metadata?.full_name || "Citizen",
            reporter_phone: user?.phone || "N/A"
          }
        ]);

      if (error) throw error;

      setStep(2);
      setIsSending(false);

      setTimeout(() => {
        onClose();
        navigate('/complaint');
      }, 2000);

    } catch (err) {
      console.error("Critical Error:", err);
      alert("Network Error: Dispatch failed. Dial 100 immediately.");
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border relative animate-in zoom-in-95 duration-200
        bg-white border-slate-200 dark:bg-[#1e293b] dark:border-slate-700">
        
        <div className="h-1.5 w-full bg-red-600"></div>
        
        <div className="px-6 py-5 border-b flex justify-between items-start border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-4">
             <div className="p-3 rounded-md shrink-0 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
               <Siren className="w-6 h-6 text-red-700 dark:text-red-500" />
             </div>
             <div>
               <h2 className="text-xl font-bold leading-none text-slate-900 dark:text-white">Emergency Protocol</h2>
               <p className="text-sm mt-1.5 text-slate-500 dark:text-slate-400">This action will be logged and sent to dispatch.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
               
               {/* Location Section */}
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Location</label>
                    <button 
                      onClick={detectLocation}
                      disabled={isLocating}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
                      {isLocating ? "Locating..." : "Refetch Location"}
                    </button>
                 </div>
                 
                 <div className={`flex items-center gap-3 p-3 rounded-md border transition-all
                   ${isLocating ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"}
                 `}>
                    <MapPin className={`w-4 h-4 ${isLocating ? "animate-bounce" : ""}`} />
                    <span className="text-sm font-medium font-mono truncate">
                      {location.display}
                    </span>
                 </div>
               </div>

               {/* Type Buttons */}
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nature of Emergency</label>
                 <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setType('police')}
                     className={`py-3 px-4 rounded-md border text-sm font-bold flex items-center justify-center gap-2 transition-all
                       ${type === 'police' 
                         ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-600' 
                         : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-[#1e293b] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'}
                     `}
                   >
                     <AlertTriangle className="w-4 h-4" /> Police / Crime
                   </button>
                   <button 
                     onClick={() => setType('medical')}
                     className={`py-3 px-4 rounded-md border text-sm font-bold flex items-center justify-center gap-2 transition-all
                       ${type === 'medical' 
                         ? 'bg-red-700 text-white border-red-700' 
                         : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-[#1e293b] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'}
                     `}
                   >
                     <Siren className="w-4 h-4" /> Medical
                   </button>
                 </div>
               </div>

               {/* --- NEW TOPIC INPUT SECTION --- */}
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Specific Topic <span className="text-red-500">*</span>
                 </label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Type className="h-4 w-4 text-slate-400" />
                   </div>
                   <input 
                     type="text" 
                     value={topic} 
                     onChange={(e) => setTopic(e.target.value)}
                     placeholder={type === 'police' ? "e.g. Armed Robbery, Kidnapping..." : "e.g. Heart Attack, Accident..."} 
                     className="w-full pl-10 p-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all
                       border-slate-200 focus:ring-slate-900/10 focus:border-slate-400
                       dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-slate-500
                     "
                   />
                 </div>
               </div>

               {/* Brief Input */}
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Situation Brief (Optional)</label>
                 <input 
                   type="text" 
                   value={description} 
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="e.g. Intruder in house, 2 men armed..." 
                   className="w-full p-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all
                     border-slate-200 focus:ring-slate-900/10 focus:border-slate-400
                     dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-slate-500
                   "
                 />
               </div>

               {/* Submit Button */}
               <div className="pt-2">
                 <button 
                   onClick={handleSubmit}
                   disabled={isSending || isLocating} 
                   className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {isSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting...</> : "Confirm & Dispatch"}
                 </button>
               </div>

            </div>
          ) : (
            /* Success State */
            <div className="py-8 flex flex-col items-center justify-center text-center">
               <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 border bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/30">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alert Registered</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Dispatch units have been notified.</p>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="p-4 border-t text-center bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">False reporting is a punishable offense under IPC Section 182.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyModal;