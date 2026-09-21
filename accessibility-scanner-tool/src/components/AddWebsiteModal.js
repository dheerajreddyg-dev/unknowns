import React, { useState } from 'react';
import { X, Globe, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const AddWebsiteModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    monitorFrequency: 'weekly',
    autoStart: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a website name');
      return;
    }
    
    if (!formData.url.trim()) {
      toast.error('Please enter a website URL');
      return;
    }
    
    let url = formData.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    if (!validateUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Test if the URL is reachable - commented out for demo
      // const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
      //   method: 'HEAD',
      //   mode: 'cors'
      // }).catch(() => null);
      
      // We'll continue regardless of the response since CORS might block the test
      onSave({
        name: formData.name.trim(),
        url: url,
        description: formData.description.trim(),
        monitoring: {
          frequency: formData.monitorFrequency,
          autoStart: formData.autoStart
        }
      });
      
      toast.success('Website added successfully!');
      onClose();
    } catch (error) {
      // Still add the website even if we can't verify it
      onSave({
        name: formData.name.trim(),
        url: url,
        description: formData.description.trim(),
        monitoring: {
          frequency: formData.monitorFrequency,
          autoStart: formData.autoStart
        }
      });
      
      toast.success('Website added successfully!');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl scrollbar-hide animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-2.5 rounded-xl">
              <Globe className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add New Website</h2>
              <p className="text-sm text-gray-600">Add a website to monitor accessibility</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-1">
          <div className="space-y-5 px-6 py-5">
            {/* Website Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Website Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Company Homepage"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>Include http:// or https://. If omitted, https:// will be added automatically.</span>
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this website..."
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Monitoring Preferences */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Monitoring Preferences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="monitorFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    id="monitorFrequency"
                    name="monitorFrequency"
                    value={formData.monitorFrequency}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors duration-200 hover:border-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="manual">Manual (on-demand)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3 pt-7">
                  <input
                    id="autoStart"
                    name="autoStart"
                    type="checkbox"
                    checked={formData.autoStart}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="autoStart" className="text-sm text-gray-700">
                    Auto-start scans when the app is open
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex flex-col items-stretch justify-end space-y-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:from-primary-700 hover:to-primary-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Website</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebsiteModal;