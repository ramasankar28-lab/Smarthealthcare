import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CreditCard,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Selected Bill Details Modal
  const [selectedBillDetails, setSelectedBillDetails] = useState<any | null>(null);

  // Add Item to Bill
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState(50);
  const [itemQty, setItemQty] = useState(1);

  // Record Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'NET_BANKING'>('CASH');

  // Refund
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    if (hospitalId) {
      loadBillingInvoices();
    }
  }, [hospitalId]);

  const loadBillingInvoices = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/billing/hospital/${hospitalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBills(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBillDetails = async (bid: number) => {
    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/billing/bills/${bid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedBillDetails(data);
        setPayAmount(data.bill.netPayable - data.bill.paidAmount);
      }
    } catch {
      setStatusMsg('Failed to fetch bill details.');
    }
  };

  const handleAddBillItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillDetails) return;

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch(`/api/billing/bills/${selectedBillDetails.bill.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: itemDesc,
          unitPrice: Number(itemPrice),
          quantity: Number(itemQty),
        }),
      });

      if (res.ok) {
        setShowAddItem(false);
        setItemDesc('');
        setStatusMsg('Item added to bill.');
        handleOpenBillDetails(selectedBillDetails.bill.id);
        loadBillingInvoices();
      }
    } catch {
      setStatusMsg('Failed to add item.');
    }
  };

  const handleRecordStaffPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillDetails) return;

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billId: selectedBillDetails.bill.id,
          hospitalId,
          amount: Number(payAmount),
          paymentMethod: payMethod,
        }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setStatusMsg('Payment recorded successfully.');
        handleOpenBillDetails(selectedBillDetails.bill.id);
        loadBillingInvoices();
      }
    } catch {
      setStatusMsg('Failed to record payment.');
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillDetails || !refundPaymentId) return;

    try {
      const token = localStorage.getItem('sh_token');
      const res = await fetch('/api/billing/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: refundPaymentId,
          billId: selectedBillDetails.bill.id,
          amount: Number(refundAmount),
          reason: refundReason,
        }),
      });

      if (res.ok) {
        setShowRefundModal(false);
        setStatusMsg('Refund processed and recorded.');
        handleOpenBillDetails(selectedBillDetails.bill.id);
        loadBillingInvoices();
      }
    } catch {
      setStatusMsg('Failed to process refund.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
              Billing & Financial Counter
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital #{hospitalId}</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Cashier & Invoicing: {user?.fullName}</h1>
          <p className="text-xs text-slate-400">
            Invoice Generation, Cashless Insurance Discounts, Payments & Refunds
          </p>
        </div>

        <button
          onClick={loadBillingInvoices}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Invoices</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hospital Billing Ledger</h3>
            <p className="text-xs text-slate-500">Itemize charges, collect payments, and manage insurance claims.</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{bills.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Patient Name</th>
                <th className="p-3.5">Gross Amount</th>
                <th className="p-3.5">Insurance Coverage</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono font-bold text-cyan-800">{b.billNumber}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{b.patientName}</span>
                    <span className="text-[10px] text-slate-400">{b.patientPhone}</span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">${b.totalAmount}</td>
                  <td className="p-3.5 text-emerald-600 font-semibold">-${b.insuranceDiscount}</td>
                  <td className="p-3.5 font-bold text-slate-900 text-sm">${b.netPayable}</td>
                  <td className="p-3.5 font-bold text-emerald-700">${b.paidAmount}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.status === 'PARTIALLY_PAID'
                          ? 'bg-cyan-50 text-cyan-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleOpenBillDetails(b.id)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Manage Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedBillDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded">
                  Invoice {selectedBillDetails.bill.billNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Patient: {selectedBillDetails.bill.patientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBillDetails(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Gross Total</span>
                <span className="font-bold text-slate-800">${selectedBillDetails.bill.totalAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Insurance Discount</span>
                <span className="font-bold text-emerald-600">-${selectedBillDetails.bill.insuranceDiscount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Net Payable</span>
                <span className="font-bold text-slate-900">${selectedBillDetails.bill.netPayable}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Paid to Date</span>
                <span className="font-bold text-cyan-700">${selectedBillDetails.bill.paidAmount}</span>
              </div>
            </div>

            {/* Itemized Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Itemized Charges & Procedures</span>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Service Description</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBillDetails.items.map((it: any) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium text-slate-900">{it.description}</td>
                        <td className="p-2.5 text-slate-600">${it.unitPrice}</td>
                        <td className="p-2.5 text-slate-600">{it.quantity}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">${it.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {selectedBillDetails.payments && selectedBillDetails.payments.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1.5">Processed Payments:</span>
                <div className="space-y-1.5">
                  {selectedBillDetails.payments.map((p: any) => (
                    <div key={p.id} className="p-2 bg-emerald-50 rounded-lg text-xs flex justify-between items-center text-emerald-950">
                      <div>
                        <span className="font-mono font-bold block">{p.transactionId}</span>
                        <span className="text-[10px] text-emerald-700">{p.paymentMethod} • {new Date(p.paidAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">${p.amount}</span>
                        <button
                          onClick={() => {
                            setRefundPaymentId(p.id);
                            setRefundAmount(p.amount);
                            setShowRefundModal(true);
                          }}
                          className="px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200 text-[10px] font-bold"
                        >
                          Refund
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Row */}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBillDetails(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Close
              </button>
              {selectedBillDetails.bill.status !== 'PAID' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Record Payment Received
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Add Bill Item</h4>
            <form onSubmit={handleAddBillItem} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Description (e.g. Blood Panel Test)"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  placeholder="Price ($)"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="number"
                  required
                  placeholder="Qty"
                  value={itemQty}
                  onChange={(e) => setItemQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Record Payment</h4>
            <form onSubmit={handleRecordStaffPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="UPI">UPI / Digital QR</option>
                  <option value="NET_BANKING">Net Banking Transfer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Process Refund</h4>
            <form onSubmit={handleProcessRefund} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Reason for Refund</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duplicate charge, doctor unavailable"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Issue Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
