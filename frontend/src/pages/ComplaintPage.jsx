import React, { useState, useRef } from "react";
import { 
  FileText, MapPin, Calendar, AlignLeft, Scale, UploadCloud, 
  DollarSign, AlertCircle, CheckCircle2, Gavel, X, Loader2 
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";

// --- CATEGORIES CONFIGURATION ---
const CASE_CATEGORIES = [
  { id: 'criminal', label: 'Criminal Defense', icon: AlertCircle, types: ['Theft', 'Assault', 'Cyber Crime', 'Bail'] },
  { id: 'civil', label: 'Civil Rights', icon: Scale, types: ['Property Dispute', 'Breach of Contract', 'Defamation'] },
  { id: 'family', label: 'Family Law', icon: FileText, types: ['Divorce', 'Child Custody', 'Alimony', 'Will/Probate'] },
  { id: 'corporate', label: 'Corporate', icon: Gavel, types: ['Startup IP', 'Employment', 'Merger', 'Taxation'] },
];

const BUDGET_RANGES = [
  "Pro Bono (Free Legal Aid)",
  "₹5,000 - ₹20,000",
  "₹20,000 - ₹50,000",
  "₹50,000 - ₹1 Lakh",
  "₹1 Lakh+"
];

const ComplaintPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [category, setCategory] = useState(CASE_CATEGORIES[0]);
  const [formData, setFormData] = useState({
    caseType: "",
    title: "",
    incidentDate: "",
    location: "",
    description: "",
    budget: "",
    selectionMode: "browse" // 'auto' or 'browse'
  });

  const [files, setFiles] = useState([]); // Stores uploaded file URLs

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (catId) => {
    const selected = CASE_CATEGORIES.find(c => c.id === catId);
    setCategory(selected);
    setFormData(prev => ({ ...prev, caseType: "" })); // Reset sub-type
  };

  // --- FILE UPLOAD LOGIC ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data } = supabase.storage.from('case-files').getPublicUrl(filePath);
      
      setFiles(prev => [...prev, { name: file.name, url: data.publicUrl }]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT CASE ---
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.caseType) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .insert([
          {
            user_id: user?.id,
            category: category.label,
            case_type: formData.caseType,
            title: formData.title,
            description: formData.description,
            incident_date: formData.incidentDate || null,
            location: formData.location,
            budget_range: formData.budget,
            documents: files.map(f => f.url), // Saving Array of URLs
            status: 'Open'
          }
        ])
        .select();

      if (error) throw error;

      // REDIRECT LOGIC based on User Choice
      if (formData.selectionMode === 'browse') {
        // We will build this page next: /find-lawyer
        navigate('/find-lawyer', { state: { caseId: data[0].id, category: category.label } });
      } else {
        alert("Case Filed! Our AI is matching you with a lawyer...");
        navigate('/my-cases');
      }

    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to file case. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
           <h1 className="text-3xl md:text-4xl font-bold font-serif-heading text-slate-900 mb-3">
             Start Your Legal Journey
           </h1>
           <p className="text-slate-500 max-w-xl mx-auto">
             Provide details about your case to connect with the right legal experts. 
             Your information is secure and encrypted.
           </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
           
           {/* Progress Bar (Visual) */}
           <div className="h-1.5 bg-slate-100 w-full">
              <div className="h-full bg-slate-900 w-1/3"></div>
           </div>

           <div className="p-6 md:p-10 space-y-8">
               
               {/* 1. Category Selection */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Step 1: Classification
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CASE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category.id === cat.id;
                      return (
                        <button 
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200
                            ${isSelected 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                          `}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span className="font-bold text-sm">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
               </div>

               {/* 2. Case Specifics */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Case Type Dropdown */}
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Specific Charge / Type</label>
                     <select 
                       name="caseType" 
                       value={formData.caseType}
                       onChange={handleInputChange}
                       className="w-full p-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                     >
                       <option value="">Select Type...</option>
                       {category.types.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Estimated Budget</label>
                     <div className="relative">
                       <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                       <select 
                         name="budget" 
                         value={formData.budget}
                         onChange={handleInputChange}
                         className="w-full pl-10 p-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                       >
                         <option value="">Select Budget Range...</option>
                         {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                       </select>
                     </div>
                  </div>
               </div>

               {/* 3. Core Details */}
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Case Subject / Title</label>
                     <input 
                       name="title" 
                       value={formData.title} 
                       onChange={handleInputChange}
                       className="w-full p-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none" 
                       placeholder="e.g. Unlawful Termination of Employment" 
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Incident Date</label>
                       <input type="date" name="incidentDate" value={formData.incidentDate} onChange={handleInputChange} className="w-full p-3.5 rounded-lg border border-slate-200 bg-slate-50 outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Location</label>
                       <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-3.5 rounded-lg border border-slate-200 bg-slate-50 outline-none" placeholder="City, State" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Detailed Description</label>
                     <textarea 
                        name="description" 
                        rows="5" 
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none resize-none"
                        placeholder="Provide a chronological account of the events. Include key dates, names, and any actions already taken..."
                     ></textarea>
                  </div>
               </div>

               {/* 4. Evidence Upload */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Step 2: Evidence & Documents
                  </label>
                  
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all group"
                  >
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       onChange={handleFileUpload} 
                       className="hidden" 
                       accept=".pdf,.jpg,.png,.docx"
                     />
                     <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                     </div>
                     <p className="font-bold text-slate-700">Click to upload documents</p>
                     <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                           <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                           </div>
                           <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                             <X className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* 5. Matching Preference */}
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-3">How would you like to proceed?</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${formData.selectionMode === 'browse' ? 'bg-white border-slate-900 ring-1 ring-slate-900' : 'bg-transparent border-slate-200 hover:bg-white'}`}>
                       <div className="flex items-center gap-3">
                          <input type="radio" name="selectionMode" value="browse" checked={formData.selectionMode === 'browse'} onChange={handleInputChange} className="accent-slate-900 w-5 h-5" />
                          <div>
                             <div className="font-bold text-slate-900">Choose Lawyer Myself</div>
                             <div className="text-xs text-slate-500">Browse directory and send requests manually.</div>
                          </div>
                       </div>
                    </label>
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${formData.selectionMode === 'auto' ? 'bg-white border-slate-900 ring-1 ring-slate-900' : 'bg-transparent border-slate-200 hover:bg-white'}`}>
                       <div className="flex items-center gap-3">
                          <input type="radio" name="selectionMode" value="auto" checked={formData.selectionMode === 'auto'} onChange={handleInputChange} className="accent-slate-900 w-5 h-5" />
                          <div>
                             <div className="font-bold text-slate-900">AI Auto-Match</div>
                             <div className="text-xs text-slate-500">Let us find the best available lawyer for you.</div>
                          </div>
                       </div>
                    </label>
                  </div>
               </div>

               {/* Submit */}
               <div className="pt-4">
                 <button 
                   onClick={handleSubmit}
                   disabled={loading || uploading}
                   className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-xl hover:bg-black hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                   {loading ? "Processing Case File..." : "File Case & Proceed"}
                 </button>
                 <p className="text-center text-xs text-slate-400 mt-4">
                   By filing this case, you agree to our Terms of Service and Privacy Policy. 
                 </p>
               </div>

           </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintPage;