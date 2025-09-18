
import React from 'react';

interface ModalProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                <div className="text-lg font-bold mb-2">{title}</div>
                <div className="text-gray-700 mb-4">{children}</div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
