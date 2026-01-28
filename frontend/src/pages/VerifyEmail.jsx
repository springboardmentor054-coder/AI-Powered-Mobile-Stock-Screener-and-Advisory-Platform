import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Matches backend: exports.verifyEmail
        await api.get(`/auth/verify/${token}`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-sm w-full text-center">
        
        {status === 'verifying' && (
           <p className="text-gray-600">Verifying your email...</p>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verified!</h2>
            <p className="text-gray-600 mb-6">Your email has been verified successfully.</p>
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              Login Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">The link is invalid or has expired.</p>
            <Link to="/login" className="text-blue-600 hover:underline">
              Return to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}