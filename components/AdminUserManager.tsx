import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { SocketMessageType, Customer } from '../types';
import { Users, Search, Crown, History, Phone, Mail, Award } from 'lucide-react';

export const AdminUserManager: React.FC = () => {
  const { sendMessage, lastMessage } = useSocket();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);

  useEffect(() => {
    sendMessage(SocketMessageType.GET_CUSTOMERS, {});
  }, [sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === SocketMessageType.CUSTOMERS_UPDATE) {
      setCustomers(lastMessage.payload.customers);
    }
  }, [lastMessage]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
      {/* DANH SÁCH USER (BÊN TRÁI) */}
      <div className="w-1/3 border-r border-slate-800 flex flex-col">
         <div className="p-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold">
               <Users size={18} /> QUẢN LÝ KHÁCH HÀNG
            </div>
            <div className="relative">
               <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
               <input 
                  type="text" 
                  placeholder="Tìm tên, sđt, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-emerald-500 outline-none"
               />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto">
            {filteredCustomers.map(user => (
               <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors ${selectedUser?.id === user.id ? 'bg-slate-800 border-l-4 border-l-emerald-500' : ''}`}
               >
                  <div className="flex items-center gap-3">
                     <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-700" />
                     <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                     </div>
                     {user.membershipLevel === 'Diamond' && <Crown size={14} className="text-yellow-500" />}
                     {user.membershipLevel === 'VIP' && <Crown size={14} className="text-purple-500" />}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* CHI TIẾT USER (BÊN PHẢI) */}
      <div className="flex-1 bg-slate-900 flex flex-col">
         {selectedUser ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
               {/* Header Profile */}
               <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800 flex items-center gap-6">
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-20 h-20 rounded-full border-2 border-emerald-500 shadow-lg" />
                  <div>
                     <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {selectedUser.name}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                           selectedUser.membershipLevel === 'Diamond' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
                           selectedUser.membershipLevel === 'VIP' ? 'border-purple-500 text-purple-500 bg-purple-500/10' :
                           'border-slate-500 text-slate-400'
                        }`}>
                           {selectedUser.membershipLevel}
                        </span>
                     </h2>
                     <div className="flex gap-4 mt-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1"><Phone size={14}/> {selectedUser.phone}</div>
                        <div className="flex items-center gap-1"><Mail size={14}/> {selectedUser.email}</div>
                     </div>
                  </div>
                  <div className="ml-auto text-right">
                     <div className="text-sm text-slate-400">Điểm tích lũy</div>
                     <div className="text-2xl font-bold text-emerald-400 flex items-center justify-end gap-1">
                        <Award size={20}/> {selectedUser.points.toLocaleString()}
                     </div>
                  </div>
               </div>

               {/* Lịch sử giao dịch */}
               <div className="flex-1 p-6 overflow-y-auto">
                  <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                     <History size={16}/> LỊCH SỬ ĐẶT VÉ
                  </h3>
                  
                  {selectedUser.history.length === 0 ? (
                      <div className="text-slate-500 italic text-sm">Chưa có lịch sử giao dịch.</div>
                  ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-700">
                                <th className="py-2 font-medium">Mã Vé</th>
                                <th className="py-2 font-medium">Phim</th>
                                <th className="py-2 font-medium">Rạp/Ghế</th>
                                <th className="py-2 font-medium">Ngày đặt</th>
                                <th className="py-2 font-medium text-right">Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedUser.history.map(ticket => (
                                <tr key={ticket.id} className="border-b border-slate-800 text-sm hover:bg-slate-800/50">
                                    <td className="py-3 text-slate-400 font-mono">{ticket.id}</td>
                                    <td className="py-3 font-bold text-white">{ticket.movieTitle}</td>
                                    <td className="py-3 text-slate-300">{ticket.theater} - <span className="text-emerald-400 font-bold">{ticket.seatId}</span></td>
                                    <td className="py-3 text-slate-400">{ticket.date}</td>
                                    <td className="py-3 text-right font-bold text-white">{ticket.price.toLocaleString()}đ</td>
                                </tr>
                            ))}
                        </tbody>
                      </table>
                  )}
               </div>
               
               {/* Footer thống kê */}
               <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500">User ID: {selectedUser.id}</span>
                  <span className="text-slate-300">Tổng chi tiêu trọn đời: <span className="text-white font-bold text-lg ml-2">{selectedUser.totalSpent.toLocaleString()}đ</span></span>
               </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
               <Users size={48} className="mb-4 opacity-20" />
               <p>Chọn một khách hàng để xem chi tiết</p>
            </div>
         )}
      </div>
    </div>
  );
};