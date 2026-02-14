import React, { useState, useEffect } from "react";
import { CheckCircle, CheckSquare, FileText, Search, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";

const IncidentReports = () => {
  const [resolvedIncidents, setResolvedIncidents] = useState([]);

  useEffect(() => {
    const fetchResolved = async () => {
      const { data } = await supabase
        .from('emergencies')
        .select('*')
        .eq('status', 'resolved')
        .order('created_at', { ascending: false });
      if (data) setResolvedIncidents(data);
    };
    fetchResolved();
  }, []);

  return (
    <div className="p-6 md:p-8 h-full bg-[#F1F5F9] overflow-y-auto">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif-heading text-slate-900">Incident Reports</h1>
                    <p className="text-slate-500 mt-1">Archive of all resolved and closed emergency cases.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                        {resolvedIncidents.length} Resolved
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Topic / Nature</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Reporter Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resolvedIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 flex flex-col items-center">
                                        <FileText className="w-10 h-10 mb-3 opacity-20" />
                                        <span>No resolved incidents found in the archive.</span>
                                    </td>
                                </tr>
                            ) : (
                                resolvedIncidents.map((inc) => (
                                    <tr key={inc.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 group-hover:bg-green-100 group-hover:border-green-200 transition-colors">
                                                <CheckCircle className="w-3 h-3" /> Resolved
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 capitalize">{inc.topic || inc.type}</div>
                                            <div className="text-xs text-slate-400 mt-0.5 capitalize">{inc.type}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={inc.location_address}>
                                            {inc.location_address || "GPS Coordinates"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {new Date(inc.created_at).toLocaleDateString()}
                                                </div>
                                                <span className="text-xs ml-4.5">{new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 font-bold">{inc.reporter_name}</div>
                                            <div className="text-xs text-slate-500">{inc.reporter_phone}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default IncidentReports;