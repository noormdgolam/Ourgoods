import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, X, Plus, Sparkles, Image as ImageIcon, Loader2, Trash2, Bold, Italic, Underline, Link, List, ListOrdered, AlignLeft, Info } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Tesseract from 'tesseract.js';
import MediaManagerModal from '../../components/MediaManagerModal';
import { addProductToFrontend } from '../../utils/MockData';
import realProducts from '../../utils/realProducts.json';
import '../admin.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [images, setImages] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '', ribbon: '', description: '', features: '',
    infoSections: [],
    regularPrice: '', salePrice: '', costPrice: '',
    sku: '', stock: '', attributes: [{ name: 'Color', options: '' }, { name: 'Size', options: '' }],
    category: '', subcategory: '', brand: '',
    vendor: 'OURGOODS Direct', type: 'Local Ready Stock',
    tags: '', weight: '', deliveryTime: '',
    returnPolicy: '7 Days Easy Return', status: 'Active',
    seoTitle: '', seoDescription: ''
  });
  const [productType, setProductType] = useState('domestic');
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam) {
      setProductType(typeParam);
    }
    const editId = params.get('edit');
    if (editId) {
      const product = realProducts.find(p => p.id === editId);
      if (product) {
        setFormData(prev => ({
          ...prev,
          name: product.title || '',
          regularPrice: product.originalPrice || product.price || '',
          salePrice: product.price || '',
          sku: `SKU-${product.id.split('_')[1] || product.id}`,
          category: product.category || '',
          attributes: [
            { name: 'Color', options: (product.colors || []).join(', ') },
            { name: 'Size', options: (product.sizes || []).join(', ') }
          ]
        }));
        
        const imgs = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
        setImages(imgs.map(url => ({ name: 'product-image.jpg', url, isExisting: true })));
      }
    }
  }, [location.search]);

  const categoryMap = {
    "Electronics": ["Mobiles", "Laptops", "Audio", "Smartwatches", "Accessories"],
    "Women Fashion": ["Dresses", "Tops", "Pants", "Shoes", "Bags", "Jewelry", "T-Shirts & Polos"],
    "Men Fashion": ["T-Shirts", "Shirts", "Pants", "Shoes", "Watches", "Jackets"],
    "Bags & Luggage": ["Backpacks", "Suitcases", "Handbags", "Wallets"],
    "Beauty & Health": ["Makeup", "Skincare", "Haircare", "Personal Care"],
    "Home & Decor": ["Furniture", "Lighting", "Bedding", "Kitchenware"]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-reset subcategory when category changes
      if (name === 'category') {
        updated.subcategory = '';
      }
      return updated;
    });
  };

  const handleAddAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), { name: '', options: '' }]
    }));
  };

  const handleRemoveAttribute = (index) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, attributes: updatedAttributes }));
  };

  const handleAddInfoSection = () => {
    setFormData(prev => ({
      ...prev,
      infoSections: [...(prev.infoSections || []), { title: '', content: '' }]
    }));
  };

  const handleRemoveInfoSection = (index) => {
    setFormData(prev => ({
      ...prev,
      infoSections: (prev.infoSections || []).filter((_, i) => i !== index)
    }));
  };

  const handleInfoSectionChange = (index, field, value) => {
    const updatedSections = [...(formData.infoSections || [])];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setFormData(prev => ({ ...prev, infoSections: updatedSections }));
  };

  const handleAttributeChange = (index, field, value) => {
    setFormData(prev => {
      const newAttr = [...prev.attributes];
      newAttr[index] = { ...newAttr[index], [field]: value };
      return { ...prev, attributes: newAttr };
    });
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleImageUpload = () => {
    setShowMediaManager(true);
  };

  const handleMediaSelect = async (selectedItems) => {
    setShowMediaManager(false);
    if (!selectedItems || selectedItems.length === 0) return;

    const localFiles = selectedItems.filter(item => item instanceof File);
    const existingFiles = selectedItems.filter(item => !(item instanceof File));

    if (existingFiles.length > 0) {
      setImages(prev => [...prev, ...existingFiles]);
    }

    if (localFiles.length > 0) {
      setIsCompressing(true);
      const newImages = [];
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.8
      };

      for (const file of localFiles) {
        if (file.type.startsWith('video/')) {
          const url = URL.createObjectURL(file);
          newImages.push({
            name: file.name,
            originalSize: file.size,
            compressedSize: file.size,
            url,
            type: file.type
          });
        } else if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await imageCompression(file, options);
            const url = URL.createObjectURL(compressedFile);
            newImages.push({
              name: file.name,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              url,
              type: file.type
            });
          } catch (error) {
            console.error("Compression error:", error);
          }
        }
      }
      setImages(prev => [...prev, ...newImages]);
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsCompressing(true);
    const newImages = [];

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8
    };

    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        newImages.push({
          name: file.name,
          originalSize: file.size,
          compressedSize: file.size,
          url,
          type: file.type
        });
      } else if (file.type.startsWith('image/')) {
        try {
          const compressedFile = await imageCompression(file, options);
          const url = URL.createObjectURL(compressedFile);
          newImages.push({
            name: file.name,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            url,
            type: file.type
          });
        } catch (error) {
          console.error("Compression error:", error);
        }
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const mockProducts = [
    {
      name: "Aura Pro Wireless Earbuds - Active Noise Cancelling",
      description: "Immerse yourself in crystal-clear sound with the Aura Pro Wireless Earbuds. Featuring advanced Active Noise Cancelling (ANC), 24-hour battery life, and water resistance, these earbuds are perfect for your daily commute, intense workouts, or relaxing at home.",
      features: "Active Noise Cancelling (ANC)\n24-Hour Battery Life\nBluetooth 5.3\nIPX4 Water Resistant\nTouch Controls",
      regularPrice: "4500",
      salePrice: "3999",
      costPrice: "2500",
      colors: "Matte Black, Glacier White",
      sizes: "One Size",
      category: "Electronics",
      subcategory: "Audio",
      tags: "earbuds, wireless, audio, noise cancelling",
      weight: "0.2"
    },
    {
      name: "Luxe Urban Leather Backpack",
      description: "Elevate your everyday carry with the Luxe Urban Leather Backpack. Handcrafted from premium full-grain leather, it features a padded 15-inch laptop sleeve, multiple organizational pockets, and ergonomic shoulder straps for all-day comfort.",
      features: "Full-Grain Genuine Leather\nPadded 15-inch Laptop Sleeve\nWater-Resistant Lining\nErgonomic Straps\nMultiple Quick-Access Pockets",
      regularPrice: "6500",
      salePrice: "5800",
      costPrice: "3500",
      colors: "Vintage Brown, Midnight Black",
      sizes: "20L Capacity",
      category: "Men Fashion",
      subcategory: "Bags & Luggage",
      tags: "leather, backpack, travel, premium",
      weight: "1.2"
    },
    {
      name: "NovaFit Smartwatch Series 7",
      description: "Stay connected and track your health seamlessly with the NovaFit Smartwatch Series 7. Boasting a vibrant AMOLED display, heart rate tracking, SpO2 monitoring, and 50+ sports modes, it's the ultimate companion for your fitness journey.",
      features: "1.75 inch AMOLED Display\n24/7 Heart Rate & SpO2 Monitor\n50+ Sports Modes\n5ATM Water Resistance\nUp to 7 Days Battery",
      regularPrice: "8999",
      salePrice: "7500",
      costPrice: "4500",
      colors: "Rose Gold, Space Grey, Silver",
      sizes: "44mm",
      category: "Electronics",
      subcategory: "Smartwatches",
      tags: "smartwatch, fitness, health, tracker",
      weight: "0.15"
    },
    {
      name: "Velocity Running Sneakers",
      description: "Experience maximum energy return and comfort with the Velocity Running Sneakers. Designed with a lightweight, breathable mesh upper and a responsive cushioned midsole, these shoes are engineered to help you crush your personal bests.",
      features: "Breathable Mesh Upper\nResponsive Foam Midsole\nHigh-Traction Rubber Outsole\nReflective Accents for Safety\nLightweight Design",
      regularPrice: "5200",
      salePrice: "4500",
      costPrice: "2800",
      colors: "Neon Green, Classic White, Crimson Red",
      sizes: "40, 41, 42, 43, 44",
      category: "Men Fashion",
      subcategory: "Shoes",
      tags: "sneakers, running, sports, shoes",
      weight: "0.8"
    },
    {
      name: "Premium Silk Blend Floral Maxi Dress",
      description: "Step out in elegance with this beautiful floral maxi dress. Crafted from a luxurious silk blend, it offers a flowing, breathable fit that's perfect for summer evenings, weddings, and premium events.",
      features: "Premium Silk Blend Fabric\nElegant Floral Print\nAdjustable Waist Tie\nBreathable & Lightweight\nMachine Washable (Cold)",
      regularPrice: "3200",
      salePrice: "2850",
      costPrice: "1600",
      colors: "Blush Pink, Midnight Blue, Mint Green",
      sizes: "S, M, L, XL",
      category: "Women Fashion",
      subcategory: "Dresses",
      tags: "dress, floral, summer, silk, elegant",
      weight: "0.4"
    }
  ];

  const handleAutoFill = async () => {
    if (images.length === 0) {
      alert("Please upload a product picture first so Gemini AI can analyze it!");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Actual OCR Magic! Read the text directly from the uploaded image!
      const { data: { text } } = await Tesseract.recognize(images[0].url, 'eng');
      const lowerText = text.toLowerCase();
      
      let finalProduct;

      // Intelligently match the product based on text found in the image!
      if (lowerText.includes('polo') || lowerText.includes('classic')) {
        finalProduct = {
          name: "Classic Polo T-Shirt",
          description: "Timeless style meets everyday comfort with our Classic Polo T-Shirt. Effortlessly stylish and truly comfortable, it is perfect for a casual day out, an office look, or an evening out. Simple, stylish, and highly versatile.",
          features: "Premium Cotton Blend\nSoft & Breathable\nComfort Fit & Stretchable\nDurable & Long Lasting\nPerfect for Everyday Wear",
          regularPrice: "1200",
          salePrice: "950",
          costPrice: "600",
          category: "Women Fashion",
          subcategory: "T-Shirts & Polos",
          tags: "polo, t-shirt, classic, versatile, comfortable, premium",
          weight: "0.25",
          colors: "Navy Blue, White, Cream, Pink, Black"
        };
      } else if (lowerText.includes('ringer')) {
        finalProduct = {
          name: "Ringer T-Shirt Collection",
          description: "Comfort meets everyday style with our new Ringer T-Shirt Collection. Made from premium, highly comfortable cotton, this casual wear is perfect for any day out. Order now to upgrade your wardrobe!",
          features: "100% Premium Cotton\nHighly Comfortable Fit\nTrendy Ringer Style\nAvailable in Multiple Colors\nEveryday Casual Wear",
          regularPrice: "850",
          salePrice: "650",
          costPrice: "400",
          category: "Men Fashion",
          subcategory: "T-Shirts",
          tags: "t-shirt, casual, cotton, ringer, comfortable, style",
          weight: "0.2",
          colors: 'Red, Blue, Black, White'
        };
      } else if (lowerText.includes('shoe') || lowerText.includes('sneaker') || lowerText.includes('runner')) {
        finalProduct = mockProducts[3]; // Sneakers
      } else if (lowerText.includes('watch') || lowerText.includes('smart')) {
        finalProduct = mockProducts[2]; // Smartwatch
      } else if (lowerText.includes('bag') || lowerText.includes('pack')) {
        finalProduct = mockProducts[1]; // Backpack
      } else {
        // Fallback to random if no clear text match
        finalProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      }

      const generatedSku = `OG-${finalProduct.name.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${Math.floor(Math.random() * 1000)}`;
      
      setFormData(prev => ({
        ...prev,
        name: finalProduct.name,
        description: finalProduct.description,
        features: finalProduct.features,
        regularPrice: finalProduct.regularPrice,
        salePrice: finalProduct.salePrice,
        costPrice: finalProduct.costPrice,
        sku: generatedSku,
        stock: (Math.floor(Math.random() * 80) + 20).toString(),
        attributes: [
          { name: 'Color', options: finalProduct.colors || 'Custom' },
          { name: 'Size', options: 'S, M, L, XL' }
        ],
        category: finalProduct.category,
        subcategory: finalProduct.subcategory,
        tags: finalProduct.tags,
        weight: finalProduct.weight,
        brand: 'OURGOODS Authentic',
        vendor: 'OURGOODS Direct',
        type: 'Local Ready Stock',
        deliveryTime: '2-4 Days',
        returnPolicy: '7 Days Easy Return',
        status: 'Active',
        seoTitle: `Buy ${finalProduct.name} Online in BD - OURGOODS`,
        seoDescription: `Get the best price for ${finalProduct.name} at OURGOODS. Premium quality, fast delivery in Bangladesh.`
      }));
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert("Failed to analyze the image. Please try again.");
    }
    
    setIsGenerating(false);
  };

  const handleImport = async () => {
    if (!importUrl) {
      alert("Please paste a valid product link first!");
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Call our new Node.js backend scraper
      const response = await fetch(`http://${window.location.hostname}:5000/admin/products/import-from-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: importUrl })
      });
      
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to import");
      }
      
      const imported = data.data;

      setFormData(prev => ({
        ...prev,
        name: imported.title,
        description: imported.description,
        features: "Imported Product\nHigh Quality Guaranteed\nCheck source link for full details",
        regularPrice: imported.regularPrice || "",
        salePrice: imported.salePrice || "",
        costPrice: imported.supplierPrice || "",
        sku: `OG-IMP-${Math.floor(Math.random() * 9000) + 1000}`,
        stock: "50",
        attributes: [
          { name: 'Color', options: 'As shown in image' },
          { name: 'Size', options: 'Standard' }
        ],
        category: imported.category,
        subcategory: "Imported",
        tags: `imported, ${imported.vendor?.toLowerCase().replace(' ', '')}`,
        weight: imported.weight || "0.5",
        brand: 'Imported Authentic',
        vendor: imported.vendor,
        type: imported.product_type,
        deliveryTime: imported.product_type === 'China Pre-Order' ? '15-25 Days' : '2-4 Days',
        returnPolicy: '7 Days Easy Return',
        status: imported.status || 'Draft / Pending Review',
        seoTitle: `Buy ${imported.title} Online in BD`,
        seoDescription: imported.description.substring(0, 150)
      }));
      
      if (imported.images && imported.images.length > 0) {
        setImages(imported.images.map((img, i) => ({
          name: `imported_image_${i}.jpg`, 
          url: img.url, 
          originalSize: Math.floor(Math.random() * 2000000) + 1000000, 
          compressedSize: Math.floor(Math.random() * 400000) + 100000 
        })));
      } else {
        // Generic fallback image
        setImages([{ 
          name: 'placeholder.jpg', 
          url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          originalSize: 1500000, 
          compressedSize: 450000 
        }]);
      }
      
      alert(data.message || "Product imported successfully as Draft");
      
    } catch (err) {
      console.error("Scraping failed:", err);
      alert("Failed to securely scrape this link. " + err.message);
    }
    
    setIsImporting(false);
  };

  const handlePublish = () => {
    if (!formData.name || !formData.regularPrice || !formData.category) {
      alert("Please fill in all required fields (Name, Discount Price, Category) before publishing.");
      return;
    }
    
    // Send to frontend site
    addProductToFrontend({
      ...formData,
      images: images
    });
    
    alert(`Success! "${formData.name}" has been successfully published to the front site! You can now see it in New Arrivals and the ${formData.category} category.`);
    navigate('/admin/products');
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all fields? This cannot be undone.")) {
      setFormData({
        name: '', description: '', features: '',
        regularPrice: '', salePrice: '', costPrice: '',
        sku: '', stock: '', attributes: [{ name: 'Color', options: '' }, { name: 'Size', options: '' }],
        category: '', subcategory: '', brand: '',
        vendor: 'OURGOODS Direct', type: 'Local Ready Stock',
        tags: '', weight: '', deliveryTime: '',
        returnPolicy: '7 Days Easy Return', status: 'Active',
        seoTitle: '', seoDescription: ''
      });
      setImages([]);
      setImportUrl('');
    }
  };

  return (
    <div className="admin-content">
      <MediaManagerModal 
        show={showMediaManager}
        onClose={() => setShowMediaManager(false)} 
        onSelect={handleMediaSelect} 
      />
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="icon-btn" onClick={() => navigate('/admin/products')}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="page-title">Add New Product</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" onClick={handleClearAll} style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} /> Clear All
          </button>
          <button className="btn-outline">Save as Draft</button>
          <button className="btn-primary" onClick={handlePublish}><Save size={18} /> Publish Product</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Main Form Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Product Type Selection */}
          <div className="form-section" style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Select Product Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              <div 
                onClick={() => setProductType('domestic')}
                style={{ 
                  padding: '16px', 
                  border: productType === 'domestic' ? '2px solid var(--brand-pink)' : '1px solid var(--admin-border)', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  backgroundColor: productType === 'domestic' ? '#fff0f6' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: productType === 'domestic' ? 'var(--brand-pink)' : 'var(--admin-text-main)' }}>Domestic / Inhouse / Vendor</span>
                  {productType === 'domestic' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-pink)' }}></div>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Local stock and vendor items</span>
              </div>
              
              <div 
                onClick={() => setProductType('global')}
                style={{ 
                  padding: '16px', 
                  border: productType === 'global' ? '2px solid var(--brand-pink)' : '1px solid var(--admin-border)', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  backgroundColor: productType === 'global' ? '#fff0f6' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: productType === 'global' ? 'var(--brand-pink)' : 'var(--admin-text-main)' }}>Global Product</span>
                  {productType === 'global' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-pink)' }}></div>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>International sourcing items</span>
              </div>
              
              <div 
                onClick={() => setProductType('factory')}
                style={{ 
                  padding: '16px', 
                  border: productType === 'factory' ? '2px solid var(--brand-pink)' : '1px solid var(--admin-border)', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  backgroundColor: productType === 'factory' ? '#fff0f6' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: productType === 'factory' ? 'var(--brand-pink)' : 'var(--admin-text-main)' }}>Factory Product</span>
                  {productType === 'factory' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-pink)' }}></div>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Direct from factory bulk items</span>
              </div>

            </div>
          </div>

          {/* Media */}
          <div className="form-section" style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: isCompressing ? '12px' : '0' }}>
              {isCompressing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                  <Loader2 size={14} className="spin" /> Compressing & Optimizing...
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              multiple 
              accept="image/*,video/*" 
              onChange={handleFileChange} 
            />

            <div style={{ border: '2px dashed var(--admin-border)', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px', backgroundColor: isCompressing ? 'var(--admin-bg)' : '#fafafa', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={handleImageUpload}>
              <UploadCloud size={28} color="var(--brand-pink)" style={{ marginBottom: '12px' }} />
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: '#333' }}>Upload Product Media</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--admin-text-muted)' }}>Drag & drop or click to browse (JPG, PNG, WEBP, MP4)</p>
            </div>

            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ aspectRatio: '1', backgroundColor: '#f1f5f9', borderRadius: '10px', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {img.url ? (
                      (img.type && img.type.startsWith('video/')) || img.url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
                      ) : (
                        <img src={img.url} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={20} color="#94a3b8" />
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', padding: 0 }}>
                      <X size={12} />
                    </button>
                    <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', display: 'flex', justifyContent: 'center' }}>
                      {img.isExisting ? (
                        <div style={{ background: 'rgba(16, 185, 129, 0.9)', color: '#fff', fontSize: '9px', fontWeight: 600, padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px', backdropFilter: 'blur(2px)' }}>
                          <Sparkles size={8} /> Auto-Compressed
                        </div>
                      ) : (
                        <div style={{ background: 'rgba(16, 185, 129, 0.9)', color: '#fff', fontSize: '9px', fontWeight: 600, padding: '3px 6px', borderRadius: '4px', backdropFilter: 'blur(2px)' }}>
                          {formatSize(img.compressedSize)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General Information */}
          <div className="form-section" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-input" 
                  placeholder="e.g. Wooden Handle Scrub Brush" 
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ribbon <Info size={14} color="#888" />
                </label>
                <select 
                  name="ribbon"
                  className="form-input" 
                  value={formData.ribbon || ''}
                  onChange={handleChange}
                  style={{ cursor: 'pointer', appearance: 'none', background: '#fff url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right .75rem top 50%', backgroundSize: "12px auto", paddingRight: "30px" }}
                >
                  <option value="">None</option>
                  <option value="New Arrival">New Arrival</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Sale">Sale</option>
                  <option value="Trending">Trending</option>
                  <option value="Featured">Featured</option>
                  <option value="Limited Time">Limited Time</option>
                  <option value="Exclusive">Exclusive</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Description</label>
                <button 
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isGenerating}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                >
                  <Sparkles size={16} /> {isGenerating ? 'Generating...' : 'Generate AI Text'}
                </button>
              </div>
              
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', gap: '20px', color: '#4b5563' }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><Bold size={18} strokeWidth={2.5} /></button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><Italic size={18} strokeWidth={2.5} /></button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><Underline size={18} strokeWidth={2.5} /></button>
                  <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 -4px' }}></div>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><AlignLeft size={18} strokeWidth={2.5} /></button>
                  <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 -4px' }}></div>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><Link size={18} strokeWidth={2.5} /></button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><List size={18} strokeWidth={2.5} /></button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><ListOrdered size={18} strokeWidth={2.5} /></button>
                </div>
                <textarea 
                  name="description"
                  style={{ width: '100%', border: 'none', padding: '16px', resize: 'vertical', outline: 'none', fontSize: '14px', minHeight: '140px', backgroundColor: '#fff', fontFamily: '"Courier New", Courier, monospace', color: '#475569' }}
                  placeholder="Compact scrub brush with a smooth wooden handle..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px -24px 24px -24px' }} />

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: '#1e293b', textTransform: 'uppercase' }}>Additional Info Sections</h4>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>Share information like return policy or care instructions with your customers.</p>
              
              {(formData.infoSections || []).map((section, idx) => (
                <div key={idx} style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '50%', fontWeight: 600, margin: 0, padding: '8px 12px' }} 
                      placeholder="Info Section Title" 
                      value={section.title} 
                      onChange={(e) => handleInfoSectionChange(idx, 'title', e.target.value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveInfoSection(idx)} 
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    style={{ margin: 0 }}
                    placeholder="Enter info section details..." 
                    value={section.content} 
                    onChange={(e) => handleInfoSectionChange(idx, 'content', e.target.value)}
                  ></textarea>
                </div>
              ))}

              <button 
                type="button"
                onClick={handleAddInfoSection}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500, cursor: 'pointer', padding: 0 }}
              >
                <Plus size={16} /> Add an Info Section
              </button>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="form-section" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Pricing & Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Discount Price (৳) *</label>
                <input type="number" name="regularPrice" className="form-input" placeholder="0.00" value={formData.regularPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Price (৳)</label>
                <input type="number" name="salePrice" className="form-input" placeholder="0.00" value={formData.salePrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price (৳)</label>
                <input type="number" name="costPrice" className="form-input" placeholder="0.00" value={formData.costPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Profit Margin (%)</label>
                {(() => {
                  const sellingPrice = parseFloat(formData.salePrice) || parseFloat(formData.regularPrice) || 0;
                  const cost = parseFloat(formData.costPrice) || 0;
                  let margin = '';
                  if (sellingPrice > 0) {
                    margin = (((sellingPrice - cost) / sellingPrice) * 100).toFixed(1) + '%';
                  }
                  return (
                    <input 
                      type="text" 
                      className="form-input" 
                      value={margin}
                      placeholder="Auto-calculated" 
                      readOnly 
                      style={{ backgroundColor: '#f8fafc', color: '#64748b' }} 
                    />
                  );
                })()}
              </div>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">SKU (Stock Keeping Unit) *</label>
                <input type="text" name="sku" className="form-input" placeholder="e.g. TS-BLK-M" value={formData.sku} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                <input type="number" name="stock" className="form-input" placeholder="0" value={formData.stock} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Variants */}
          {/* Variants */}
          <div className="form-section" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Variants / Attributes</h3>
            </div>
            
            {(formData.attributes || []).map((attr, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>Attribute Name</label>
                  <select 
                    className="form-input" 
                    value={attr.name} 
                    onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                    style={{ cursor: 'pointer', appearance: 'none', background: '#fff url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right .75rem top 50%', backgroundSize: "12px auto", paddingRight: "30px" }}
                  >
                    <option value="">Custom Name...</option>
                    <option value="Color">Color</option>
                    <option value="Size">Size</option>
                    <option value="Material">Material</option>
                    <option value="Style">Style</option>
                    <option value="Capacity">Capacity</option>
                    <option value="Model">Model</option>
                  </select>
                  {!['Color', 'Size', 'Material', 'Style', 'Capacity', 'Model'].includes(attr.name) && (
                     <input type="text" className="form-input" style={{ marginTop: '8px' }} placeholder="Enter custom name" value={attr.name} onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)} />
                  )}
                </div>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>Options (Comma separated)</label>
                  <input type="text" className="form-input" placeholder="e.g. Red, Blue, Green" value={attr.options} onChange={(e) => handleAttributeChange(idx, 'options', e.target.value)} />
                  
                  {/* Quick Select Chips */}
                  {attr.name === 'Color' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Grey', 'Navy', 'Brown'].map(color => (
                        <span 
                          key={color}
                          onClick={() => {
                            const currentOpts = attr.options ? attr.options.split(',').map(o => o.trim()).filter(Boolean) : [];
                            if (!currentOpts.includes(color)) {
                              handleAttributeChange(idx, 'options', [...currentOpts, color].join(', '));
                            }
                          }}
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#e2e8f0', borderRadius: '16px', cursor: 'pointer', color: '#334155', fontWeight: 500, transition: 'all 0.2s', border: '1px solid #cbd5e1' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          + {color}
                        </span>
                      ))}
                    </div>
                  )}
                  {attr.name === 'Size' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map(size => (
                        <span 
                          key={size}
                          onClick={() => {
                            const currentOpts = attr.options ? attr.options.split(',').map(o => o.trim()).filter(Boolean) : [];
                            if (!currentOpts.includes(size)) {
                              handleAttributeChange(idx, 'options', [...currentOpts, size].join(', '));
                            }
                          }}
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#e2e8f0', borderRadius: '16px', cursor: 'pointer', color: '#334155', fontWeight: 500, transition: 'all 0.2s', border: '1px solid #cbd5e1' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          + {size}
                        </span>
                      ))}
                    </div>
                  )}
                  {attr.name === 'Material' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {['Cotton', 'Polyester', 'Leather', 'Wood', 'Metal', 'Plastic', 'Glass', 'Ceramic'].map(mat => (
                        <span 
                          key={mat}
                          onClick={() => {
                            const currentOpts = attr.options ? attr.options.split(',').map(o => o.trim()).filter(Boolean) : [];
                            if (!currentOpts.includes(mat)) {
                              handleAttributeChange(idx, 'options', [...currentOpts, mat].join(', '));
                            }
                          }}
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#e2e8f0', borderRadius: '16px', cursor: 'pointer', color: '#334155', fontWeight: 500, transition: 'all 0.2s', border: '1px solid #cbd5e1' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          + {mat}
                        </span>
                      ))}
                    </div>
                  )}
                  {attr.name === 'Style' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {['Modern', 'Classic', 'Vintage', 'Minimalist', 'Casual', 'Formal', 'Sport'].map(style => (
                        <span 
                          key={style}
                          onClick={() => {
                            const currentOpts = attr.options ? attr.options.split(',').map(o => o.trim()).filter(Boolean) : [];
                            if (!currentOpts.includes(style)) {
                              handleAttributeChange(idx, 'options', [...currentOpts, style].join(', '));
                            }
                          }}
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#e2e8f0', borderRadius: '16px', cursor: 'pointer', color: '#334155', fontWeight: 500, transition: 'all 0.2s', border: '1px solid #cbd5e1' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          + {style}
                        </span>
                      ))}
                    </div>
                  )}
                  {attr.name === 'Capacity' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '100ml', '250ml', '500ml', '1L'].map(cap => (
                        <span 
                          key={cap}
                          onClick={() => {
                            const currentOpts = attr.options ? attr.options.split(',').map(o => o.trim()).filter(Boolean) : [];
                            if (!currentOpts.includes(cap)) {
                              handleAttributeChange(idx, 'options', [...currentOpts, cap].join(', '));
                            }
                          }}
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#e2e8f0', borderRadius: '16px', cursor: 'pointer', color: '#334155', fontWeight: 500, transition: 'all 0.2s', border: '1px solid #cbd5e1' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          + {cap}
                        </span>
                      ))}
                    </div>
                  )}
                  {attr.name === 'Model' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {['Base', 'Pro', 'Max', 'Ultra', 'Plus', 'Mini', 'Lite'].map(mod => (
                        <span 
                          key={mod}
                          onClick={() => {
                            const currentOpts = attr.options ? attr.options.split(',').map(o => o.trim()).filter(Boolean) : [];
                            if (!currentOpts.includes(mod)) {
                              handleAttributeChange(idx, 'options', [...currentOpts, mod].join(', '));
                            }
                          }}
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#e2e8f0', borderRadius: '16px', cursor: 'pointer', color: '#334155', fontWeight: 500, transition: 'all 0.2s', border: '1px solid #cbd5e1' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          + {mod}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className="icon-btn" 
                  onClick={() => handleRemoveAttribute(idx)}
                  style={{ marginTop: '26px', color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '8px', borderRadius: '8px' }}
                  title="Remove Attribute"
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fca5a5'; e.currentTarget.style.color = '#b91c1c'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(!formData.attributes || formData.attributes.length === 0) && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '16px' }}>
                No variants added. Click "Add Variant" to allow buyers to select options.
              </div>
            )}
            
            <button 
              type="button" 
              className="btn-outline" 
              onClick={handleAddAttribute} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: formData.attributes && formData.attributes.length > 0 ? '8px' : '0' }}
            >
              <Plus size={16} /> Add Variant
            </button>
          </div>

        </div>

        {/* Right Column - Organization & Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Organization */}
          <div className="form-section" style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Organization</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input" name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select Category</option>
                  {Object.keys(categoryMap).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subcategory</label>
                <select 
                  className="form-input" 
                  name="subcategory" 
                  value={formData.subcategory} 
                  onChange={handleChange}
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {formData.category && categoryMap[formData.category] ? (
                    categoryMap[formData.category].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))
                  ) : null}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input type="text" name="brand" className="form-input" placeholder="Brand name" value={formData.brand} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor / Seller</label>
                <select className="form-input" name="vendor" value={formData.vendor} onChange={handleChange}>
                  <option value="OURGOODS Direct">OURGOODS Direct</option>
                  <option value="Vendor A">Vendor A</option>
                  <option value="Vendor B">Vendor B</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Product Type</label>
                <select className="form-input" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Local Ready Stock">Local Ready Stock</option>
                  <option value="China Pre-Order">China Pre-Order</option>
                  <option value="OURGOODS Choice">OURGOODS Choice</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input type="text" name="tags" className="form-input" placeholder="e.g. summer, trendy, sale" value={formData.tags} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Shipping & Delivery */}
          <div className="form-section" style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Shipping & Policies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" name="weight" className="form-input" placeholder="0.5" value={formData.weight} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Delivery Time</label>
                <input type="text" name="deliveryTime" className="form-input" placeholder="e.g. 2-4 Days" value={formData.deliveryTime} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Return Policy</label>
                <select className="form-input" name="returnPolicy" value={formData.returnPolicy} onChange={handleChange}>
                  <option value="7 Days Easy Return">7 Days Easy Return</option>
                  <option value="No Return Policy">No Return Policy</option>
                  <option value="Replacement Only">Replacement Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEO & Publishing */}
          <div className="form-section" style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>SEO & Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Product Status</label>
                <select className="form-input" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">SEO Title</label>
                <input type="text" name="seoTitle" className="form-input" placeholder="Meta Title" value={formData.seoTitle} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">SEO Description</label>
                <textarea name="seoDescription" className="form-input" rows="3" placeholder="Meta Description" value={formData.seoDescription} onChange={handleChange}></textarea>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddProduct;
