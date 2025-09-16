"use client";
import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Home, Calendar, DollarSign, Tag, FileText, Clock, Edit3, ArrowLeft, MoreVertical } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Button } from '@/app/components/Buttons';
import axios from 'axios';

const BuyerDetailsPage = () => {
  const [buyer, setBuyer] = useState<any|null>(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();

  const getBuyerIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const segments = path.split('/');
      return segments[segments.length - 1];
    }
    return null;
  };
  
  const buyerId = getBuyerIdFromUrl();

  const statusColors:any = {
    New: "bg-blue-100 text-blue-800",
    Qualified: "bg-green-100 text-green-800",
    Contacted: "bg-yellow-100 text-yellow-800",
    Visited: "bg-purple-100 text-purple-800",
    Negotiation: "bg-orange-100 text-orange-800",
    Converted: "bg-emerald-100 text-emerald-800",
    Dropped: "bg-red-100 text-red-800",
  };

  const enumMappings = {
    BHK: {
      'One': '1',
      'Two': '2',
      'Three': '3',
      'Four': '4'
    },
    Timeline: {
      'ZeroToThree': '0-3m',
      'ThreeToSix': '3-6m',
      'MoreThanSix': '>6m',
      'Exploring': 'Exploring'
    },
    Source: {
      'WalkIn': 'Walk-in'
    }
  };

  const fetchBuyer = async () => {
    try {
      setLoading(true);
      const response = await axios(`${process.env.NEXT_PUBLIC_API_URL}/buyer/buyer/?id=${buyerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.data) throw new Error('Failed to fetch');
      const data = response.data;
      if (data.success) {
        setBuyer(data.info);
        setError("");
      }
    } catch (err) {
      setError('Failed to fetch buyer data');
      console.error('Error fetching buyer:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerHistory = async () => {
    setLoading(true)
    try {
      setHistoryLoading(true);
      const response = await axios(`${process.env.NEXT_PUBLIC_API_URL}/buyer/history?id=${buyerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.data) throw new Error('Failed to fetch history');
      const data = response.data
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching buyer history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (buyerId) {
      setIsLoaded(true);
      fetchBuyer();
      fetchBuyerHistory();
      
    }
  }, [buyerId]);

  const formatBudget = (min:number, max:number) => {
    const formatAmount = (amount:number) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
      return `₹${amount.toLocaleString()}`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    if (min) return `₹${formatAmount(min)}+`;
    if (max) return `Up to ${formatAmount(max)}`;
    return "Not specified";
  };

  const formatDate:any = (dateString:string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  type EnumField = keyof typeof enumMappings;
type EnumValue = string;

const getDisplayValue = (field: EnumField, value: EnumValue): string => {
  if (enumMappings[field] && enumMappings[field][value as keyof typeof enumMappings[EnumField]]) {
    return enumMappings[field][value as keyof typeof enumMappings[EnumField]];
  }
  if (enumMappings.Source[value as keyof typeof enumMappings.Source]) {
    return enumMappings.Source[value as keyof typeof enumMappings.Source];
  }
  return value;
};

  const renderHistoryDiff = (diff: any) => {
    console.log('Rendering diff:', diff); 
    
    if (diff.action === "BUYER_CREATED" || diff.created) {
      return <span className="text-green-600 font-medium">Buyer created</span>;
    }

    if (diff.action === "STATUS_UPDATED" && diff.statusChange) {
      return (
        <div className="mb-1">
          <span className="font-semibold capitalize text-slate-700">Status:</span>
          <span className="text-red-500 line-through mx-2">
            {diff.statusChange.from}
          </span>
          <span className="text-green-600 font-medium">
            {diff.statusChange.to}
          </span>
        </div>
      );
    }

    if (diff.action === "BUYER_UPDATED" && diff.changes) {
      return Object.entries(diff.changes).map(([field, change]: [string, any]) => (
        <div key={field} className="mb-1">
          <span className="font-semibold capitalize text-slate-700">
            {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
          </span>
          {change && typeof change === "object" && "from" in change && "to" in change ? (
            <>
              <span className="text-red-500 line-through mx-2">
                {Array.isArray(change.from) 
                  ? change.from.join(", ") 
                  : change.from || "Not set"
                }
              </span>
              <span className="text-green-600 font-medium">
                {Array.isArray(change.to) 
                  ? change.to.join(", ") 
                  : change.to || "Not set"
                }
              </span>
            </>
          ) : (
            <span className="text-green-600 font-medium ml-2">
              {Array.isArray(change) 
                ? change.join(", ") 
                : String(change)
              }
            </span>
          )}
        </div>
      ));
    }

    return Object.entries(diff)
      .filter(([key]) => key !== 'action' && key !== 'timestamp')
      .map(([field, change]: [string, any]) => (
        <div key={field} className="mb-1">
          <span className="font-semibold capitalize text-slate-700">
            {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
          </span>
          {change && typeof change === "object" && "from" in change && "to" in change ? (
            <>
              <span className="text-red-500 line-through mx-2">
                {Array.isArray(change.from) 
                  ? change.from.join(", ") 
                  : change.from || "Not set"
                }
              </span>
              <span className="text-green-600 font-medium">
                {Array.isArray(change.to) 
                  ? change.to.join(", ") 
                  : change.to || "Not set"
                }
              </span>
            </>
          ) : (
            <span className="text-green-600 font-medium ml-2">
              {Array.isArray(change) 
                ? change.join(", ") 
                : field === "timestamp" 
                  ? formatDate(change) 
                  : String(change)
              }
            </span>
          )}
        </div>
      ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading buyer details...</p>
        </div>
      </div>
    );
  }

  if (error && !buyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-8 text-center max-w-md mx-4">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Button variant="primary" onClick={fetchBuyer}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className=" mt-25 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className={`mb-8 transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="md"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leads
            </Button>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  {buyer?.fullName}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColors[buyer?.status]}`}>
                    {buyer?.status}
                  </span>
                  <span className="text-slate-500 text-sm">
                    ID: {buyer?.id}
                  </span>
                  {buyer?.tags && buyer.tags.length > 0 && (
                    <div className="flex gap-2">
                      {buyer.tags.map((tag:string, index:any) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {String(buyer?.ownerId) === localStorage.getItem("session-id") && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push(`/buyers/edit/${buyer.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Buyer
                  </Button>
                )}
                <Button variant="outline" size="md" className="p-3">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 transition-all duration-1000 delay-200 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      EMAIL
                    </p>
                    <p className="text-slate-900 font-medium">
                      {buyer?.email || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      PHONE
                    </p>
                    <p className="text-slate-900 font-medium">
                      {buyer?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      CITY
                    </p>
                    <p className="text-slate-900 font-medium">
                      {buyer?.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      SOURCE
                    </p>
                    <p className="text-slate-900 font-medium">
                      {getDisplayValue('Source', buyer?.source)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 transition-all duration-1000 delay-300 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Home className="w-5 h-5 text-primary-600" />
                Property Requirements
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    PROPERTY TYPE
                  </p>
                  <p className="text-slate-900 font-semibold text-lg">
                    {buyer?.propertyType}
                  </p>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    BHK
                  </p>
                  <p className="text-slate-900 font-semibold text-lg">
                    {buyer?.bhk ? `${getDisplayValue('BHK', buyer.bhk)} BHK` : 'Not specified'}
                  </p>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    PURPOSE
                  </p>
                  <p className="text-slate-900 font-semibold text-lg">
                    {buyer?.purpose}
                  </p>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-4 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    BUDGET RANGE
                  </p>
                  <p className="text-slate-900 font-semibold text-lg">
                    {formatBudget(buyer?.budgetMin, buyer?.budgetMax)}
                  </p>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    TIMELINE
                  </p>
                  <p className="text-slate-900 font-semibold text-lg">
                    {getDisplayValue('Timeline', buyer?.timeline)}
                  </p>
                </div>
              </div>
            </div>

            {buyer?.notes && (
              <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 transition-all duration-1000 delay-400 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Notes
                </h2>
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <p className="text-slate-700 leading-relaxed">
                    {buyer.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 transition-all duration-1000 delay-500 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Timeline
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      CREATED
                    </p>
                    <p className="text-slate-900 font-medium">
                      {formatDate(buyer?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      LAST UPDATED
                    </p>
                    <p className="text-slate-900 font-medium">
                      {formatDate(buyer?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 transition-all duration-1000 delay-600 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Change History
              </h3>
              
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {history.map((entry:any, index) => (
                    <div
                      key={entry.id}
                      className="border-l-2 border-slate-200 pl-4 pb-4 last:pb-0"
                    >
                      <div className="text-xs text-slate-500 mb-2">
                        {formatDate(entry.changedAt)} by {entry.changedBy}
                      </div>
                      <div className="text-sm">
                        {renderHistoryDiff(entry.diff)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No changes recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDetailsPage;