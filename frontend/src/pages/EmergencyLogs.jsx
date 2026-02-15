import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  X, 
  Save,
  Loader2,
  Siren,
  Filter
} from "lucide-react";
import { supabase } from "../lib/supabase"; 

const EmergencyLogs = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [topicInput, setTopicInput] = useState("");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchEmergencies = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('emergencies')
        .select('*')
        // We generally want to see Active/Dispatching logs first
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching logs:", error);
      
      if (data) {
        setEmergencies(data);
      }
      setIsLoading(false);
    };

    fetchEmergencies();

    // Realtime Subscription
    const channel = supabase
      .channel('public:emergencies_logs_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, (payload) => {
        // Refresh data on any change (Insert or Update)
        fetchEmergencies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- MODAL HANDLERS ---
  const openTopicModal = (id, currentTopic) => {
    setEditingId(id);
    setTopicInput(currentTopic || "");
    setIsModalOpen(true);
  };

  const saveTopic = async () => {
    // Optimistic Update
    const updated = emergencies.map(log => 
      log.id === editingId ? { ...log, topic: topicInput } : log
    );
    setEmergencies(updated);
    setIsModalOpen(false);

    // DB Update
    await supabase
      .from('emergencies')
      .update({ topic: topicInput })
      .eq('id', editingId);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-3">
             <ShieldAlert className="w-8 h-8 text-red-600" />
             Emergency Logs
           </h1>
           <p className="text-slate-500 mt-2">Live feed of all distress signals and interventions.</p>
        </div>
        
        <div className="flex gap-2">
           <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
           </span>
           <span className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-bold text-red-600 shadow-sm flex items-center gap-2">
              <Siren className="w-4 h-4" /> {emergencies.filter(e => e.status !== 'resolved').length} Active
           </span>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border shadow-sm overflow-hidden bg-white border-slate-200 dark:bg-[#1e293b] dark:border-slate-700 min-h-[400px]">
         
         {/* Table Header */}
         <div className="grid grid-cols-12 p-4 border-b text-xs font-bold uppercase tracking-wider bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
            <div className="col-span-6">Topic / Type</div>
            <div className="col-span-3">Time</div>
            <div className="col-span-3 text-right">Status</div>
         </div>

         {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               <span className="text-sm font-medium">Syncing with Grid...</span>
            </div>
         ) : emergencies.length === 0 ? (
            <div className="p-20 text-center text-slate-400 italic">
               No emergency logs found in the database.
            </div>
         ) : (
            emergencies.map((log) => (
               <div key={log.id} className="grid grid-cols-12 p-4 border-b transition-colors items-center border-slate-100 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-800/50">
                  
                  {/* Col 1: Type & Topic */}
                  <div className="col-span-6 flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                        ${log.status === 'resolved' 
                           ? 'bg-green-100 text-green-600' 
                           : 'bg-red-50 text-red-600 animate-pulse'
                        }`}>
                        <AlertTriangle className="w-5 h-5" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate capitalize">
                              {log.topic || log.type}
                           </div>
                           <button 
                              onClick={() => openTopicModal(log.id, log.topic)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                           >
                              <Edit3 className="w-3 h-3" />
                           </button>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                           <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium capitalize">{log.type}</span>
                           <span className="flex items-center gap-1 text-slate-400 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3" /> {log.location_address || "GPS Coordinates"}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Col 2: Time */}
                  <div className="col-span-3 text-sm font-medium text-slate-600 dark:text-slate-400 flex flex-col">
                     <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Col 3: Status */}
                  <div className="col-span-3 text-right">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide
                        ${log.status === 'resolved' 
                           ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                           : 'bg-red-50 text-red-700 border-red-100'}
                     `}>
                        {log.status}
                     </span>
                  </div>
               </div>
            ))
         )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
           <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">Edit Incident Topic</h3>
                 <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
              </div>
              <input 
                autoFocus
                type="text" 
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                placeholder="e.g. Armed Robbery..."
              />
              <button onClick={saveTopic} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black flex justify-center gap-2">
                <Save className="w-4 h-4" /> Save Update
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyLogs;