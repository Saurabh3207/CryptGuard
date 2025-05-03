const Modal = ({ title, description, onConfirm, onCancel }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 transform transition-all duration-300 scale-100 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
          <div className="flex justify-end gap-4 pt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-medium transition-all duration-300"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default Modal;
  