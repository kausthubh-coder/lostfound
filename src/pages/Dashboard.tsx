import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, GeoPoint, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../firebase'; // We'll create this file next
import LocationPicker from '../components/LocationPicker';
import { Link } from 'react-router-dom';

interface Item {
  id: string;
  coordinates: GeoPoint;
  description: string;
  image: string;
  lostlocation: string;
  title: string;
  user: string;
}

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lostlocation: '',
    image: '',
    latitude: 0,
    longitude: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auth = getAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Item[];
      setItems(itemsData);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      try {
        setIsUploading(true);
        const storageRef = ref(storage, `items/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setFormData(prev => ({ ...prev, image: downloadURL }));
      } catch (error) {
        console.error('Error uploading image:', error);
        // Handle error appropriately
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const newItem = {
        title: formData.title,
        description: formData.description,
        lostlocation: formData.lostlocation,
        image: formData.image,
        coordinates: new GeoPoint(formData.latitude, formData.longitude),
        user: auth.currentUser.uid
      };

      await addDoc(collection(db, "items"), newItem);
      setIsFormOpen(false);
      setFormData({
        title: '',
        description: '',
        lostlocation: '',
        image: '',
        latitude: 0,
        longitude: 0,
      });
      fetchItems(); // Refresh the items list
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!auth.currentUser) return;
    
    try {
      await deleteDoc(doc(db, "items", itemId));
      // Refresh the items list after deletion
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lost Items</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="card group animate-in slide-in-from-bottom-4 duration-700"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-lg font-semibold text-white">
                  {item.title}
                </h3>
              </div>
              <div className="p-4">
                <p className="text-gray-300 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                      />
                    </svg>
                    {item.lostlocation}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/messages?chat=${item.user}`}
                      className="flex items-center px-3 py-1.5 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                        />
                      </svg>
                      Contact
                    </Link>
                    {auth.currentUser && item.user === auth.currentUser.uid && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this item?')) {
                            handleDelete(item.id);
                          }
                        }}
                        className="flex items-center px-3 py-1.5 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-800 animate-in slide-in-from-bottom-4 duration-500 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Add New Item</h2>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="addItemForm" onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input bg-gray-800 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500"
                      placeholder="Enter item title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input bg-gray-800 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500 min-h-[100px]"
                      placeholder="Enter item description"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Lost Location</label>
                    <input
                      type="text"
                      value={formData.lostlocation}
                      onChange={(e) => setFormData({ ...formData, lostlocation: e.target.value })}
                      className="input bg-gray-800 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500"
                      placeholder="Enter location where item was lost"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Image</label>
                    <div className="flex flex-col items-center space-y-4">
                      {imagePreview ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image: '' }));
                            }}
                            className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full hover:bg-gray-800"
                          >
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex justify-center space-x-4">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Choose File
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Take Photo
                            </button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </div>
                      )}
                      {isUploading && (
                        <div className="w-full flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Select Location on Map</label>
                    <LocationPicker
                      onLocationSelect={(lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng
                        }));
                      }}
                      initialLat={formData.latitude}
                      initialLng={formData.longitude}
                    />
                    <p className="text-xs text-gray-500">
                      Selected coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-800">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 
                    hover:border-gray-600 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    form="addItemForm"
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 
                    transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 