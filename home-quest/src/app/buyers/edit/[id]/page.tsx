"use client"
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/app/components/Buttons";
import { useRouter } from "next/navigation";

export default function AddData() {
    const router = useRouter();
    const [formData, setFormData] = useState<any|null>({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        propertyType: "",
        bhk: null,
        purpose: "",
        budgetMin: "",
        budgetMax: "",
        timeline: "",
        source: "",
        status: "",
        notes: "",
        tags: []
    });
    
    const [originalData, setOriginalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatedTags, setUpdatedTags] = useState<string[]>([
  "Investment", "First Home", "Urgent", "Premium", "Budget"
]);
    
    const getBuyerIdFromUrl = () => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const segments = path.split('/');
            return segments[segments.length - 1];
        }
        return null;
    };
    const fetchBuyer = async () => {
        try {
            setLoading(true);
            const buyerId = getBuyerIdFromUrl();
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/buyer/buyer/?id=${buyerId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!response.data) throw new Error('Failed to fetch');
            const data = response.data;
            if (data.success) {
                setFormData(data.info);
                setOriginalData(data.info); 
                setError("");
                setUpdatedTags(prev =>
    Array.from(new Set([...prev, ...((data.info.tags) || [])]))
  );
                console.log(updatedTags);
            }
        } catch (err) {
            setError('Failed to fetch buyer data');
            console.error('Error fetching buyer:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuyer();
    }, [])

    const buyerId = getBuyerIdFromUrl();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const propertyTypes = ["Apartment", "Villa", "Plot", "Office", "Retail"];
    const bhkOptions = [1, 2, 3, 4];
    const purposes = ["Buy", "Rent"];
    const timelines = ["0-3m", "3-6m", "6m", "Exploring"];
    const sources = ["Website", "Referral", "Walk-in", "Call", "Other"];
    const statuses = ["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"];
    const city = ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]

    const handleInputChange = (e: any) => {
        const { name, value, type } = e.target;
        setFormData((prev:any) => ({
            ...prev,
            [name]: type === "number" ? (value === "" ? "" : Number(value)) : value
        }));
    };

    const handleTagChange = (tag: any) => {
        setFormData((prev:any) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t:string) => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const bhkcnv: Record<string, string> = {
        "1": "One",
        "2": "Two",
        "3": "Three",
        "4": "Four"
    };

    const timecnv: Record<string, string> = {
        "0-3m": "ZeroToThree",
        "3-6m": "ThreeToSix",
        "6m": "MoreThanSix"
    }

    const getChangedFields = () => {
        if (!originalData) return formData;

        const changes: any = {};
        const keys = Object.keys(formData) as Array<keyof typeof formData>;
        
        for (const key of keys) {
            const currentValue:any = formData[key];
            const originalValue:any = originalData[key];
            
            if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
                if (JSON.stringify(currentValue.sort()) !== JSON.stringify(originalValue.sort())) {
                    changes[key] = currentValue;
                }
            } else if (currentValue !== originalValue) {
                changes[key] = currentValue;
            }
        }
        
        return changes;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setMessage("");

        if (!formData.fullName || !formData.phone || !formData.city || !formData.propertyType ||
            !formData.purpose || !formData.timeline || !formData.source || !formData.status) {
            setMessage("Please fill in all required fields.");
            setIsSubmitting(false);
            return;
        }

        try {
            const changedFields = getChangedFields();
            
            if (Object.keys(changedFields).length === 0) {
                setMessage("No changes detected.");
                setIsSubmitting(false);
                return;
            }

            const submitData = {
                ...changedFields,
                budgetMin: changedFields.budgetMin !== undefined 
                    ? (changedFields.budgetMin ? Number(changedFields.budgetMin) : null) 
                    : undefined,
                budgetMax: changedFields.budgetMax !== undefined 
                    ? (changedFields.budgetMax ? Number(changedFields.budgetMax) : null) 
                    : undefined,
                bhk: changedFields.bhk !== undefined 
                    ? (changedFields.bhk === "" ? null : changedFields.bhk)
                    : undefined
            };

            Object.keys(submitData).forEach(key => {
                if (submitData[key] === undefined) {
                    delete submitData[key];
                }
            });

            console.log('Submitting only changed fields:', submitData);

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/buyer/edit/${buyerId}`,
                submitData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.data.success) {
                setMessage("Data submitted successfully!");
                router.back();
            } else {
                throw new Error('Failed to submit data');
            }
        } catch (error) {
            console.error('Error submitting data:', error);
            setMessage("Error submitting data. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mt-25 min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-25 min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <div className="text-red-500 text-lg">{error}</div>
            </div>
        );
    }

    return (
        <div className="mt-25 min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-primary mb-8 text-center">
                        Edit Property Lead
                    </h1>

                    <div className="space-y-6">
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Enter email address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City *
                                    </label>
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select city</option>
                                        {city.map(cityName => (
                                            <option key={cityName} value={cityName}>{cityName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Property Type *
                                    </label>
                                    <select
                                        name="propertyType"
                                        value={formData.propertyType}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select property type</option>
                                        {propertyTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {!["", "Office", "Plot", "Retail"].includes(formData.propertyType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            BHK
                                        </label>
                                        <select
                                            name="bhk"
                                            value={formData.bhk || ""}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Select BHK</option>
                                            {bhkOptions.map(bhk => (
                                                <option key={bhk} value={bhkcnv[bhk]}>
                                                    {bhk} BHK
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Purpose *
                                    </label>
                                    <select
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select purpose</option>
                                        {purposes.map(purpose => (
                                            <option key={purpose} value={purpose}>{purpose}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timeline *
                                    </label>
                                    <select
                                        name="timeline"
                                        value={formData.timeline}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select timeline</option>
                                        {timelines.map(timeline => (
                                            <option key={timeline} value={timecnv[timeline]}>{timeline}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Budget Min (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="budgetMin"
                                        value={formData.budgetMin}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Minimum budget"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Budget Max (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="budgetMax"
                                        value={formData.budgetMax}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Maximum budget"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lead Management</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Source *
                                    </label>
                                    <select
                                        name="source"
                                        value={formData.source}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select source</option>
                                        {sources.map(source => (
                                            <option key={source} value={source}>{source}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status *
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select status</option>
                                        {statuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {updatedTags.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleTagChange(tag)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${formData.tags.includes(tag)
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="Additional notes or comments"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-3 px-6 rounded-md font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? 'Submitting...' : 'Update Lead Data'}
                            </Button>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-md ${message.includes('Error')
                                    ? 'bg-red-50 text-red-800 border border-red-200'
                                    : 'bg-green-50 text-green-800 border border-green-200'
                                }`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}