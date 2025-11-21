import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Copy, Check, Send } from 'lucide-react';
import Button from '../ui/Button';
import TextareaField from '../ui/TextareaField';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ReminderModal = ({isOpen, onClose, invoiceId}) => {

  const { user } = useAuth();
  const [reminderText, setReminderText] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      const generateReminder = async () => {
        setIsLoading(true);
        setReminderText('');
        setClientEmail('');
        
        try {
          const response = await axiosInstance.post(API_PATHS.AI.GENERATE_REMINDER, { invoiceId });
          setReminderText(response.data.reminderText);
          
          if (response.data.clientEmail) {
            setClientEmail(response.data.clientEmail);
          }

        } catch (error) {
          toast.error('Failed to generate reminder.');
          console.error('AI reminder error:', error);
        } finally {
          setIsLoading(false);
        }
      };

      generateReminder();
    }
  }, [isOpen, invoiceId]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reminderText);
    setHasCopied(true);
    toast.success('Reminder copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (!reminderText) return;

    // Improved Parsing Logic for "To:", "Subject:", and "Message Body:"
    // The regex is flexible to match keys with or without bold markers.
    let to = clientEmail; // Default fallback
    let subject = "Invoice Reminder";
    let body = reminderText;

    // Regex to extract parts. 
    // Matches "To:", "Subject:", "Message Body:" case-insensitively.
    // Captures content after the colon until the next newline or section.
    const toRegex = /To:?\s*(.*?)(\r\n|\r|\n)/i;
    const subjectRegex = /Subject:?\s*(.*?)(\r\n|\r|\n)/i;
    const bodyRegex = /Message Body:?\s*([\s\S]*)/i;

    const toMatch = reminderText.match(toRegex);
    const subjectMatch = reminderText.match(subjectRegex);
    const bodyMatch = reminderText.match(bodyRegex);

    if (toMatch && toMatch[1]) {
        to = toMatch[1].trim();
    }
    
    if (subjectMatch && subjectMatch[1]) {
        subject = subjectMatch[1].trim();
    }

    if (bodyMatch && bodyMatch[1]) {
        body = bodyMatch[1].trim();
    } else {
        // Fallback: If specific keys aren't found or parsing fails, try to strip known headers
        body = reminderText
            .replace(toRegex, "")
            .replace(subjectRegex, "")
            .replace(/Message Body:?\s*/i, "") 
            .trim();
    }

    // Construct mailto link
    const mailtoLink = `mailto:${to}?from=${user?.email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
  };

  if (!isOpen) return null

  return (
     <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black/10 bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative text-left transform transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-900" />
              AI-Generated Reminder
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <TextareaField 
                name="reminderText"
                value={reminderText}
                readOnly
                rows={12}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button 
              variant="secondary" 
              onClick={handleCopyToClipboard} 
              icon={hasCopied ? Check : Copy} 
              disabled={isLoading || !reminderText}
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
            <Button 
              onClick={handleSendEmail} 
              icon={Send} 
              disabled={isLoading || !reminderText}
            >
              Send via Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReminderModal