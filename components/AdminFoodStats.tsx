import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { SocketMessageType, Customer, FoodItem } from '../types';
import { Popcorn, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

export const AdminFoodStats: React.FC = () => {
  const { sendMessage, lastMessage } = useSocket();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalFoodRevenue, setTotalFoodRevenue] = useState(0);
  const [foodStats, setFoodStats] = useState<{name: string, count: number, revenue: number}[]>([]);

  useEffect(() => {
    sendMessage(SocketMessageType.GET_FOODS, {});
    sendMessage(SocketMessageType.GET_CUSTOMERS, {});
  }, [sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === SocketMessageType.FOODS_UPDATE) {
      setFoods(lastMessage.payload.foods);
    }
    if (lastMessage.type === SocketMessageType.CUSTOMERS_UPDATE) {
      setCustomers(lastMessage.payload.customers);
    }
  }, [lastMessage]);

  useEffect(() => {
      // Calculate Stats whenever customers or foods update
      let revenue = 0;
      const statsMap: Record<string, {name: string, count: number, revenue: number}> = {};

      customers.forEach(cust => {
          cust.history.forEach(ticket => {
              revenue += (ticket.foodTotal || 0);
              if (ticket.foodItems) {
                  ticket.foodItems.forEach(item => {
                      if (!statsMap[item.name]) {
                          statsMap[item.name] = { name: item.name, count: 0, revenue: 0 };
                      }
                      statsMap[item.name].count += item.quantity;
                      statsMap[item.name].revenue += item.price;
                  });
              }
          });
      });

      setTotalFoodRevenue(revenue);
      setFoodStats(Object.values(statsMap).sort((a, b) => b.count - a.count)); // Sort by popularity

  }, [customers, foods]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Popcorn className="text-orange-500" size={20} />
                <h2 className="font-bold text-white uppercase tracking-wider">Thống kê F&B (Đồ ăn & Thức uống)</h2>
            </div>
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-3">
                <span className="text-xs text-slate-400 uppercase">Tổng Doanh Thu Food</span>
                <span className="text-xl font-bold text-orange-500">{totalFoodRevenue.toLocaleString()}đ</span>
            </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
                
                {/* Left Column: Popular Items Chart */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-500"/> Món ăn được yêu thích nhất
                    </h3>
                    <div className="space-y-4">
                        {foodStats.length === 0 ? <div className="text-slate-500 text-sm italic">Chưa có dữ liệu bán hàng.</div> : 
                        foodStats.slice(0, 5).map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300 font-medium">{item.name}</span>
                                    <span className="text-slate-400">{item.count} đã bán</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${(item.count / (foodStats[0]?.count || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Menu List */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                     <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-blue-500"/> Danh sách Menu hiện tại
                    </h3>
                    <div className="space-y-3 h-64 overflow-y-auto pr-2">
                        {foods.map(food => (
                            <div key={food.id} className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-700">
                                <img src={food.image} alt={food.name} className="w-10 h-10 rounded object-cover" />
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-200">{food.name}</div>
                                    <div className="text-xs text-slate-500">{food.category}</div>
                                </div>
                                <div className="font-bold text-orange-400 text-sm">{food.price.toLocaleString()}đ</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom Table: Detailed Revenue */}
            <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                 <div className="p-3 bg-slate-900 border-b border-slate-700 font-bold text-xs text-slate-300 uppercase">
                     Chi tiết doanh thu theo món
                 </div>
                 <table className="w-full text-left border-collapse text-sm">
                     <thead>
                         <tr className="bg-slate-800/50 text-slate-400 text-xs">
                             <th className="p-3">Tên món</th>
                             <th className="p-3 text-center">Số lượng bán</th>
                             <th className="p-3 text-right">Doanh thu</th>
                         </tr>
                     </thead>
                     <tbody>
                         {foodStats.map((item, idx) => (
                             <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                 <td className="p-3 text-slate-200 font-medium">{item.name}</td>
                                 <td className="p-3 text-center text-slate-400">{item.count}</td>
                                 <td className="p-3 text-right text-emerald-400 font-bold">{item.revenue.toLocaleString()}đ</td>
                             </tr>
                         ))}
                         {foodStats.length === 0 && (
                             <tr><td colSpan={3} className="p-4 text-center text-slate-500 italic">Chưa có dữ liệu</td></tr>
                         )}
                     </tbody>
                 </table>
            </div>
        </div>
    </div>
  );
};