'use client';

import { useState } from 'react';

// Định nghĩa kiểu dữ liệu cho Giường
export interface Bed {
  id: string;
  code: string; // VD: A1, A2, B1, B2
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
}

interface VisualBedMapProps {
  roomName: string;
  beds: Bed[];
  onSelectBed: (bed: Bed | null) => void;
}

export default function VisualBedMap({ roomName, beds, onSelectBed }: VisualBedMapProps) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  const handleBedClick = (bed: Bed) => {
    if (bed.status !== 'available') return;
    
    // Toggle chọn/bỏ chọn
    if (selectedBedId === bed.id) {
      setSelectedBedId(null);
      onSelectBed(null);
    } else {
      setSelectedBedId(bed.id);
      onSelectBed(bed);
    }
  };

  // Hàm helper để render màu sắc tùy theo trạng thái
  const getBedStyles = (bed: Bed) => {
    if (bed.status === 'occupied') return 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400';
    if (bed.status === 'maintenance') return 'bg-red-100 text-red-500 cursor-not-allowed border-red-300 border-dashed';
    if (selectedBedId === bed.id) return 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105 transition-transform';
    return 'bg-white text-gray-700 border-green-500 hover:bg-green-50 cursor-pointer transition-colors';
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Sơ đồ phòng {roomName}</h3>
        
        {/* Chú thích (Legend) */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-white border border-green-500 rounded-sm"></div> Trống</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-600 rounded-sm"></div> Đang chọn</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-300 rounded-sm"></div> Đã có người</div>
        </div>
      </div>

      {/* Cấu trúc căn phòng */}
      <div className="relative w-full max-w-2xl mx-auto border-4 border-gray-400 rounded-lg p-8 bg-white min-h-[400px]">
        {/* Cửa ra vào */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-gray-200 border-x-4 border-t-4 border-gray-400 rounded-t-md flex items-center justify-center">
          <span className="text-xs text-gray-500 font-medium">Cửa ra vào</span>
        </div>

        {/* Khu vực tủ đồ / hành lang giữa */}
        <div className="absolute top-10 bottom-10 left-1/2 transform -translate-x-1/2 w-16 bg-gray-100 rounded flex flex-col items-center justify-center border border-gray-200 text-gray-400 text-sm">
          Lối đi chung
        </div>

        {/* Lưới hiển thị giường chia làm 2 cột (Trái/Phải) */}
        <div className="grid grid-cols-2 gap-x-32 gap-y-6">
          {beds.map((bed) => (
            <div
              key={bed.id}
              onClick={() => handleBedClick(bed)}
              className={`relative h-24 rounded-lg border-2 flex flex-col items-center justify-center ${getBedStyles(bed)}`}
            >
              {/* Hình gối để trông giống cái giường */}
              <div className={`absolute top-2 w-10 h-4 rounded-full opacity-50 ${selectedBedId === bed.id ? 'bg-white' : 'bg-gray-400'}`}></div>
              
              <span className="font-bold text-lg mt-4">{bed.code}</span>
              {bed.status === 'available' && (
                <span className="text-xs opacity-80">{bed.price.toLocaleString('vi-VN')}đ</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}