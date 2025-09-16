"use client"
import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { Button } from '../components/Buttons';
import axios from 'axios';

const BuyersCSVUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile:any) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError("");
      setUploadResult(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleFileInputChange = (e:any) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleDrop = (e:any) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e:any) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e:any) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadCSV = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError("");
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/import_csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = response.data;

      if (response.data.success) {
        setUploadResult(result);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.message || result.error || 'Upload failed');
      }
    } catch (err:any) {
      if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.data) {
        setError(err.response.data.message || err.response.data.error || 'Upload failed');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/csv_template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/csv')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'buyers_import_template.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const result = await response.json();
          setError(result.message || result.error || 'Template download failed');
        }
      } else {
        try {
          const result = await response.json();
          setError(result.message || result.error || 'Template download failed');
        } catch {
          setError(`HTTP ${response.status}: Failed to download template`);
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Template download error:', err);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearResults = () => {
    setUploadResult(null);
    setError("");
  };

  return (
    <div className="mt-25 sm:mt-8 lg:mt-25 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
              <span className="truncate">Import Buyers CSV</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Upload a CSV file to import buyer information in bulk
            </p>
          </div>
          
          <Button
            onClick={downloadTemplate}
            disabled={downloadingTemplate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xs:inline">{downloadingTemplate ? 'Downloading...' : 'Download Template'}</span>
            <span className="xs:hidden">{downloadingTemplate ? 'Loading...' : 'Template'}</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-primary hover:bg-primary/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-800 truncate">{file.name}</p>
                  <p className="text-xs text-green-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 text-green-600 hover:text-green-800 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-base sm:text-lg font-medium text-gray-700">
                    <span className="hidden sm:inline">Drop your CSV file here, or </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:text-primary/80 underline"
                    >
                      <span className="sm:hidden">Select CSV File</span>
                      <span className="hidden sm:inline">browse</span>
                    </button>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Supports CSV files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {file && (
            <Button
              onClick={uploadCSV}
              disabled={uploading}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-800 font-medium text-sm sm:text-base">Error</p>
                <p className="text-red-700 text-xs sm:text-sm mt-1 break-words">{error}</p>
                <button
                  onClick={clearResults}
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadResult && (
          <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-green-800 font-medium text-sm sm:text-base">Import Successful!</p>
                <p className="text-green-700 text-xs sm:text-sm mt-1 break-words">{uploadResult.message}</p>
                
                {uploadResult.summary && (
                  <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm">
                    <div className="bg-white p-2 sm:p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">Total Rows</p>
                      <p className="text-base sm:text-lg font-bold text-primary">{uploadResult.summary.totalRows}</p>
                    </div>
                    <div className="bg-white p-2 sm:p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">Successful</p>
                      <p className="text-base sm:text-lg font-bold text-green-600">{uploadResult.summary.successful}</p>
                    </div>
                    <div className="bg-white p-2 sm:p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">Failed</p>
                      <p className="text-base sm:text-lg font-bold text-red-600">{uploadResult.summary.failed}</p>
                    </div>
                    <div className="bg-white p-2 sm:p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">Duplicates</p>
                      <p className="text-base sm:text-lg font-bold text-yellow-600">{uploadResult.summary.duplicatesSkipped}</p>
                    </div>
                  </div>
                )}

                {uploadResult.summary?.errors && uploadResult.summary.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Sample Errors:</p>
                    <div className="bg-white rounded border border-green-200 p-2 sm:p-3 max-h-32 sm:max-h-40 overflow-y-auto">
                      {uploadResult.summary.errors.slice(0, 5).map((error:any, index:any) => (
                        <div key={index} className="text-xs text-gray-700 mb-2 last:mb-0 break-all">
                          <span className="font-medium">Row {error.row}:</span> {JSON.stringify(error.errors)}
                        </div>
                      ))}
                      {uploadResult.summary.errors.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2">... and {uploadResult.summary.errors.length - 5} more errors</p>
                      )}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={clearResults}
                  className="text-green-600 hover:text-green-800 text-xs sm:text-sm underline mt-3"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-teal-900 mb-2 text-sm sm:text-base">CSV Import Guidelines</h3>
            <ul className="text-xs sm:text-sm text-teal-800 space-y-1">
              <li>• Download the template first to see the required format</li>
              <li>• All column names must match exactly (case-sensitive)</li>
              <li className="break-words">• <strong>Required fields:</strong> fullName, phone, city, propertyType, purpose, budgetMin, budgetMax, timeline, source, status</li>
              <li>• <strong>Optional fields:</strong> email, bhk, notes, tags</li>
              <li>• <strong>Field constraints:</strong></li>
              <li className="ml-4 break-words">- <strong>city:</strong> Chandigarh, Mohali, Zirakpur, Panchkula, Other</li>
              <li className="ml-4 break-words">- <strong>propertyType:</strong> Apartment, Villa, Plot, Office, Retail</li>
              <li className="ml-4">- <strong>bhk:</strong> One, Two, Three, Four</li>
              <li className="ml-4">- <strong>purpose:</strong> Buy, Rent</li>
              <li className="ml-4 break-words">- <strong>timeline:</strong> ZeroToThree, ThreeToSix, MoreThanSix, Exploring</li>
              <li className="ml-4 break-words">- <strong>source:</strong> Website, Referral, WalkIn, Call, Other</li>
              <li className="ml-4 break-words">- <strong>status:</strong> New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped</li>
              <li>• Duplicates (by email) will be automatically skipped</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyersCSVUpload;