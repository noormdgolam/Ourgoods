import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveScrollAndNavigate } from '../utils/navigation';
import { getAllProducts } from '../utils/MockData';

const OurgoodsPreOrder = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  // Get Global / Pre-Order products and randomize on refresh
  const preOrderProducts = useMemo(() => {
    const products = getAllProducts()
      .filter(p => p.type === 'global' || p.type === 'China Pre-Order' || p.product_type === 'Global Product')
      .sort((a, b) => b.soldCount - a.soldCount) // High selling
      .slice(0, 30) // Top 30
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, 15);
      
    if (products.length === 0) {
      return getAllProducts()
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 30)
        .sort(() => 0.5 - Math.random())
        .slice(0, 15);
    }
    return products;
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollLeft = () => {
    setCurrentIndex(prev => {
      const prevIdx = prev - 3;
      return prevIdx < 0 ? Math.max(0, preOrderProducts.length - 3) : prevIdx;
    });
  };
  const scrollRight = () => {
    setCurrentIndex(prev => {
      const next = prev + 3;
      return next >= preOrderProducts.length ? 0 : next;
    });
  };

  return (
    <div style={{ padding: '0 15px', marginBottom: '15px' }}>
      <div style={{
        background: '#fff',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 15px',
          background: 'linear-gradient(90deg, var(--brand-pink), #ff4a9e)', // Premium brand background
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="las la-globe" style={{ color: '#fff', fontSize: '24px' }}></i>
                <span style={{ fontWeight: 900, fontSize: '16px', color: '#fff', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Global Shop</span>
              </div>
            </div>
            
            {/* Delivery text */}
            <div style={{ paddingLeft: '28px', fontSize: '9px', letterSpacing: '-0.2px', whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.9)', marginTop: '2px', fontWeight: 600 }}>
              Standard: 21-28 Days • Express: 4-7 Days
            </div>
          </div>

          <div 
            onClick={() => saveScrollAndNavigate(navigate, '/market/global-shop')}
            style={{ color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
            View All <i className="las la-angle-right" style={{ fontSize: '14px' }}></i>
          </div>
        </div>

        {/* Product Row */}
        <div style={{ position: 'relative' }}>
          <div className="desktop-slider-arrow" style={{ left: '5px' }} onClick={scrollLeft}>
            <i className="las la-angle-left"></i>
          </div>
          <div className="desktop-slider-arrow" style={{ right: '5px' }} onClick={scrollRight}>
            <i className="las la-angle-right"></i>
          </div>
          
          <div ref={scrollRef} className="no-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '15px', scrollBehavior: 'smooth' }}>
            {preOrderProducts.slice(currentIndex, currentIndex + 3).map((product) => (
            <div key={product.id} style={{ minWidth: '110px', width: '110px', flexShrink: 0, display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate(`/product/${product.id}`)}>
              
              {/* Image Box */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5', marginBottom: '8px', border: '1px solid #eaeaea' }}>
                <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Plus Button */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '4px', 
                  right: '4px', 
                  background: '#111', 
                  color: '#fff', 
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  <i className="las la-plus"></i>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product.title}
              </div>

              {/* Prices */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2px' }}>
                <span style={{ color: 'var(--brand-pink)', fontWeight: 900, fontSize: '15px' }}>৳{Number(product.price).toLocaleString()}</span>
                {product.originalPrice > product.price && (
                  <span style={{ color: '#999', fontSize: '10px', textDecoration: 'line-through' }}>৳{Number(product.originalPrice).toLocaleString()}</span>
                )}
              </div>

              {/* Sold Count */}
              <div style={{ color: '#888', fontSize: '10px', fontWeight: 500 }}>
                {product.soldCount > 1000 ? (product.soldCount / 1000).toFixed(1) + 'k' : product.soldCount} Sold
              </div>

            </div>
          ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OurgoodsPreOrder;
