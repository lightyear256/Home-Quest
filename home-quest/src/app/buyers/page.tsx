"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  MoreVertical,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { Button } from "../components/Buttons";

const statusColors: any = {
  New: "bg-blue-100 text-blue-800",
  Qualified: "bg-green-100 text-green-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  Visited: "bg-purple-100 text-purple-800",
  Negotiation: "bg-orange-100 text-orange-800",
  Converted: "bg-emerald-100 text-emerald-800",
  Dropped: "bg-red-100 text-red-800",
};

const syncFiltersWithURL = (filters: any, searchQuery: string, router: any) => {
  const params = new URLSearchParams();
  
  if (filters.city) params.set('city', filters.city);
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.status) params.set('status', filters.status);
  if (filters.timeline) params.set('timeline', filters.timeline);
  if (searchQuery.trim()) params.set('search', searchQuery.trim());
  
  const queryString = params.toString();
  const newUrl = queryString ? `/buyers?${queryString}` : '/buyers';
  
  router.replace(newUrl, { scroll: false });
};

function BuyersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<any | null>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<any | null>([]);
  
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    status: searchParams.get('status') || '',
    timeline: searchParams.get('timeline') || '',
  });
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedBuyers, setSelectedBuyers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<any | null>("");

  const itemsPerPage = 10;

  async function fetcher() {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/buyer/buyer`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setBuyers(response.data.buyers);
        setFilteredBuyers(response.data.buyers);
      }
    } catch (e: any) {
      console.log("error Encountered ", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setIsLoaded(true);
    fetcher();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFiltersAndSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, buyers, sortField, sortDirection]);

  const applyFiltersAndSearch = useCallback(() => {
    if (buyers) {
      let filtered = [...buyers];

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (buyer) =>
            buyer.fullName.toLowerCase().includes(query) ||
            buyer.phone.includes(query) ||
            (buyer.email && buyer.email.toLowerCase().includes(query))
        );
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          filtered = filtered.filter((buyer) => buyer[key] === value);
        }
      });

      filtered.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField === "updatedAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (sortDirection === "desc") {
          return aValue > bValue ? -1 : 1;
        }
        return aValue < bValue ? -1 : 1;
      });

      setFilteredBuyers(filtered);
      setCurrentPage(1);
    }
  }, [searchQuery, filters, buyers, sortField, sortDirection]);

  const handleFilterChange = (key: any, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);
    
    syncFiltersWithURL(newFilters, searchQuery, router);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    syncFiltersWithURL(filters, value, router);
  };

  const clearFilters = () => {
    const clearedFilters = {
      city: "",
      propertyType: "",
      status: "",
      timeline: "",
    };
    
    setFilters(clearedFilters);
    setSearchQuery("");
    
    router.replace('/buyers', { scroll: false });
  };

  const formatBudget = (min: number, max: number) => {
    const formatAmount = (amount: number) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDeleteBuyer = (buyer: string) => {
    setBuyerToDelete(buyer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (buyerToDelete) {
      setBuyers((prev: any) => prev.filter((b: any) => b.id !== buyerToDelete));
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/buyer/delete`,
        {
          data: { id: buyerToDelete },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setShowDeleteModal(false);
        setBuyerToDelete("");
      }
    }
  };

  const handleStatusChange = async (buyerId: string, newStatus: any) => {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/buyer/update_status`,
      {
        status: newStatus,
        id: buyerId,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (response.data.success) {
      setBuyers((prev: any) =>
        prev.map((buyer: any) =>
          buyer.id === buyerId
            ? {
                ...buyer,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : buyer
        )
      );
    }
  };

  const exportToCSV = () => {
    const headers =
      "fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status";
    const rows = filteredBuyers
      .map(
        (buyer: any) =>
          `"${buyer.fullName}","${buyer.email || ""}","${buyer.phone}","${
            buyer.city
          }","${buyer.propertyType}","${buyer.bhk || ""}","${buyer.purpose}","${
            buyer.budgetMin || ""
          }","${buyer.budgetMax || ""}","${buyer.timeline}","${
            buyer.source
          }","${buyer.notes || ""}","${buyer.tags.join(";")}","${buyer.status}"`
      )
      .join("\n");

    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `buyers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBuyers = filteredBuyers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

  return (
    <div className="mt-25 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div
          className={`mb-8 transition-all duration-1000 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Buyer Leads
              </h1>
              <p className="text-slate-600">
                Manage and track your buyer leads
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => router.push("/import")}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Link href={"/buyers/new"}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push("/buyers/new")}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Lead
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div
          className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 mb-6 transition-all duration-1000 delay-200 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {Object.values(filters).some((v) => v) && (
                <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                  {Object.values(filters).filter((v) => v).length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Cities</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Mohali">Mohali</option>
                <option value="Zirakpur">Zirakpur</option>
                <option value="Panchkula">Panchkula</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={filters.propertyType}
                onChange={(e) =>
                  handleFilterChange("propertyType", e.target.value)
                }
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Property Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
                <option value="Office">Office</option>
                <option value="Retail">Retail</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Contacted">Contacted</option>
                <option value="Visited">Visited</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Converted">Converted</option>
                <option value="Dropped">Dropped</option>
              </select>

              <select
                value={filters.timeline}
                onChange={(e) => handleFilterChange("timeline", e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Timelines</option>
                <option value="ZeroToThree">0-3 months</option>
                <option value="ThreeToSix">3-6 months</option>
                <option value="MoreThanSix">&gt;6 months</option>
                <option value="Exploring">Exploring</option>
              </select>

              <div className="md:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-600">
            Showing {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, filteredBuyers.length)} of{" "}
            {filteredBuyers.length} leads
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={`${sortField}_${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split("_");
                setSortField(field);
                setSortDirection(direction);
              }}
              className="text-sm border border-slate-200 rounded px-2 py-1"
            >
              <option value="updatedAt_desc">Latest Updated</option>
              <option value="fullName_asc">Name A-Z</option>
              <option value="fullName_desc">Name Z-A</option>
              <option value="budgetMin_desc">Budget High-Low</option>
              <option value="budgetMin_asc">Budget Low-High</option>
            </select>
          </div>
        </div>

        <div
          className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden transition-all duration-1000 delay-400 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Property Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedBuyers.map((buyer: any) => (
                  <tr
                    key={buyer.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {buyer.fullName}
                        </div>
                        {buyer.email && (
                          <div className="text-sm text-slate-500">
                            {buyer.email}
                          </div>
                        )}
                        {buyer.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {buyer.tags.slice(0, 2).map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {buyer.tags.length > 2 && (
                              <span className="text-xs text-slate-500">
                                +{buyer.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{buyer.phone}</td>
                    <td className="px-6 py-4 text-slate-900">{buyer.city}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{buyer.propertyType}</div>
                      {buyer.bhk && (
                        <div className="text-sm text-slate-500">
                          {buyer.bhk} BHK
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">
                        {formatBudget(buyer.budgetMin, buyer.budgetMax)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {buyer.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {buyer.timeline}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={buyer.status}
                        onChange={(e) =>
                          handleStatusChange(buyer.id, e.target.value)
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${
                          statusColors[buyer.status]
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Visited">Visited</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Converted">Converted</option>
                        <option value="Dropped">Dropped</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(buyer.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/buyers/${buyer.id}`)}
                          className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {String(buyer.ownerId) ===
                          localStorage.getItem("session-id") && (
                          <div className="flex gap-x-1">
                            <button
                              onClick={() =>
                                router.push(`/buyers/edit/${buyer.id}`)
                              }
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBuyer(buyer.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {filteredBuyers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No leads found
            </h3>
            <p className="text-slate-500/50 mb-6">
              Try adjusting your search or filters
            </p>
            <Button variant="primary" onClick={() => router.push("/add_lead")}>
              Add Your First Lead
            </Button>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Delete Lead</h3>
                <p className="text-sm text-slate-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-slate-700 mb-6">
              Are you sure you want to delete{" "}
              <strong>{buyerToDelete?.fullName}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading buyer details...</p>
      </div>
    </div>
  );
}

export default function BuyersPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BuyersContent />
    </Suspense>
  );
}