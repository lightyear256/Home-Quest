"use client"
import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { Button } from '../components/Buttons';
import axios from 'axios';

const BuyersCSVUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);


  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

//   const uploadCSV = async () => {
//     if (!file) {
//       setError('Please select a file first');
//       return;
//     }

//     setUploading(true);
//     setError(null);
//     setUploadResult(null);

//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/import_csv`, {
       
//         formData,
//         headers: {
//           // Don't set Content-Type, let browser set it with boundary for FormData
//           'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
//         }
//       });

//       const result =  response.data;

//       if (response.data.success) {
//         setUploadResult(result);
//         setFile(null);
//         if (fileInputRef.current) {
//           fileInputRef.current.value = '';
//         }
//       } else {
//         setError(result.message || result.error || 'Upload failed');
//       }
//     } catch (err) {
//       setError('Network error. Please check your connection and try again.');
//       console.error('Upload error:', err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const downloadTemplate = async () => {
//     setDownloadingTemplate(true);
//     setError(null);

//     try {
//       const response = await axios(`${process.env.NEXT_PUBLIC_API_URL}/admin/csv_template`, {

//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
//         }
//       });

//       if (response.data.success) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'buyers_import_template.csv';
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//       } else {
//         const result = response.data;
//         setError(result.message || result.error || 'Template download failed');
//       }
//     } catch (err) {
//       setError('Network error. Please check your connection and try again.');
//       console.error('Template download error:', err);
//     } finally {
//       setDownloadingTemplate(false);
//     }
//   };

const uploadCSV = async () => {
  if (!file) {
    setError('Please select a file first');
    return;
  }

  setUploading(true);
  setError(null);
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
  } catch (err) {
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
  setError(null);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/csv_template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      // Check if response is CSV (text/csv) or JSON (error)
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/csv')) {
        // Handle CSV file download
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
        // Handle JSON error response
        const result = await response.json();
        setError(result.message || result.error || 'Template download failed');
      }
    } else {
      // Handle HTTP error
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
    setError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearResults = () => {
    setUploadResult(null);
    setError(null);
  };

  return (
    <div className=" mt-25 max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Import Buyers CSV
            </h2>
            <p className="text-gray-600 mt-1">
              Upload a CSV file to import buyer information in bulk
            </p>
          </div>
          
          <Button
            onClick={downloadTemplate}
            disabled={downloadingTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {downloadingTemplate ? 'Downloading...' : 'Download Template'}
          </Button>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-green-800">{file.name}</p>
                  <p className="text-xs text-green-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your CSV file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:text-primary/80 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
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
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={clearResults}
                className="text-red-600 hover:text-red-800 text-sm underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Success Display */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">Import Successful!</p>
                <p className="text-green-700 text-sm mt-1">{uploadResult.message}</p>
                
                {uploadResult.summary && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900">Total Rows</p>
                      <p className="text-lg font-bold text-primary">{uploadResult.summary.totalRows}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900">Successful</p>
                      <p className="text-lg font-bold text-green-600">{uploadResult.summary.successful}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900">Failed</p>
                      <p className="text-lg font-bold text-red-600">{uploadResult.summary.failed}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="font-medium text-gray-900">Duplicates Skipped</p>
                      <p className="text-lg font-bold text-yellow-600">{uploadResult.summary.duplicatesSkipped}</p>
                    </div>
                  </div>
                )}

                {uploadResult.summary?.errors && uploadResult.summary.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-gray-900 mb-2">Sample Errors:</p>
                    <div className="bg-white rounded border border-green-200 p-3 max-h-40 overflow-y-auto">
                      {uploadResult.summary.errors.map((error, index) => (
                        <div key={index} className="text-xs text-gray-700 mb-2 last:mb-0">
                          <span className="font-medium">Row {error.row}:</span> {JSON.stringify(error.errors)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={clearResults}
                  className="text-green-600 hover:text-green-800 text-sm underline mt-3"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Information Card */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
  <div className="flex items-start gap-3">
    <Info className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
    <div>
      <h3 className="font-medium text-teal-900 mb-2">CSV Import Guidelines</h3>
      <ul className="text-sm text-teal-800 space-y-1">
        <li>• Download the template first to see the required format</li>
        <li>• All column names must match exactly (case-sensitive)</li>
        <li>• Required fields: fullName, phone, city, propertyType, purpose, budgetMin, budgetMax, timeline, source, status</li>
        <li>• Optional fields: email, bhk, notes, tags</li>
        <li>• <strong>Field constraints:</strong></li>
        <li className="ml-4">- <strong>city:</strong> Chandigarh, Mohali, Zirakpur, Panchkula, Other</li>
        <li className="ml-4">- <strong>propertyType:</strong> Apartment, Villa, Plot, Office, Retail</li>
        <li className="ml-4">- <strong>bhk:</strong> One, Two, Three, Four</li>
        <li className="ml-4">- <strong>purpose:</strong> Buy, Rent</li>
        <li className="ml-4">- <strong>timeline:</strong> ZeroToThree, ThreeToSix, MoreThanSix, Exploring</li>
        <li className="ml-4">- <strong>source:</strong> Website, Referral, WalkIn, Call, Other</li>
        <li className="ml-4">- <strong>status:</strong> New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped</li>
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