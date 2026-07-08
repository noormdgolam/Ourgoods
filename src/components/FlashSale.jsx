import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveScrollAndNavigate } from '../utils/navigation';

import { getAllProducts } from '../utils/MockData';

const FlashSale = ({ category }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 13,
    seconds: 5
  });
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };


  const displayProducts = useMemo(() => {
    const allProducts = getAllProducts();
    const flashSaleProducts = allProducts
      .filter(p => p.discount >= 20 || p.isFlashSale)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 30)
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    return category 
      ? flashSaleProducts.filter(p => p.category === category)
      : flashSaleProducts;
  }, [category]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              // Timer done, just stick at 0 or restart
              hours = 2;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (time) => time.toString().padStart(2, '0');

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
        background: '#111',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Flash Icon & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="las la-bolt" style={{ color: '#fff', fontSize: '24px' }}></i>
              <span style={{ fontWeight: 900, fontSize: '16px', color: '#fff', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Flash Sale</span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '30px', marginTop: '2px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px', fontWeight: 600, marginRight: '2px' }}>Ends in</span>
            
            <div style={{ background: '#222', border: 'none', color: 'var(--brand-pink)', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', fontWeight: 800 }}>
              {formatTime(timeLeft.hours)}
            </div>
            <span style={{ color: 'var(--brand-pink)', fontSize: '10px', fontWeight: 900 }}>:</span>
            
            <div style={{ background: '#222', border: 'none', color: 'var(--brand-pink)', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', fontWeight: 800 }}>
              {formatTime(timeLeft.minutes)}
            </div>
            <span style={{ color: 'var(--brand-pink)', fontSize: '10px', fontWeight: 900 }}>:</span>
            
            <div style={{ background: '#222', border: 'none', color: 'var(--brand-pink)', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', fontWeight: 800 }}>
              {formatTime(timeLeft.seconds)}
            </div>
          </div>
        </div>

        {/* View All */}
        <div 
          onClick={() => saveScrollAndNavigate(navigate, '/market/flash-sale')}
          style={{ color: 'var(--brand-pink)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
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
          {displayProducts.map((product) => (
          <div key={product.id} style={{ minWidth: '110px', width: '110px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            
            {/* Image Box */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5', marginBottom: '8px' }}>
              <img src={product.image || product.images?.[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Discount Badge */}
              <div style={{ position: 'absolute', top: '0', left: '0', background: 'var(--brand-pink)', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '3px 6px', borderBottomRightRadius: '8px' }}>
                -{product.discount || 0}%
              </div>
              
              {/* Heart Icon */}
              <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', fontSize: '14px' }}>
                <i className="lar la-heart"></i>
              </div>
            </div>

            {/* Title */}
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.title}
            </div>

            {/* Prices */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2px' }}>
              <span style={{ color: 'var(--brand-pink)', fontWeight: 900, fontSize: '14px' }}>৳{Number(product.price).toLocaleString()}</span>
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

export default FlashSale;
