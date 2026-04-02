import { ref } from 'vue'
import { orderApi } from '../api'
import { useToastStore } from '../stores/toast'

export interface PaymentMethod {
  id: number
  name: string
  icon: string
  handling_fee_fixed: number
  handling_fee_percent: number
}

export function useCheckout() {
  const toast = useToastStore()

  const showPayModal = ref(false)
  const payMethods = ref<PaymentMethod[]>([])
  const currentTradeNo = ref('')
  const payLoading = ref(false)
  const methodLoading = ref(false)

  async function openPayment(tradeNo: string) {
    currentTradeNo.value = tradeNo
    methodLoading.value = true
    showPayModal.value = true
    try {
      const res: any = await orderApi.getPaymentMethod()
      payMethods.value = res.data || []
    } catch {
      toast.error('获取支付方式失败')
      showPayModal.value = false
    } finally {
      methodLoading.value = false
    }
  }

  async function confirmPay(methodId: number) {
    if (!currentTradeNo.value) return
    payLoading.value = true
    try {
      const res: any = await orderApi.checkout(currentTradeNo.value, methodId)
      showPayModal.value = false

      const data = res.data
      if (!data) {
        // Balance deduction / free order
        toast.success('支付成功')
        return { success: true, redirect: false }
      }
      if (typeof data === 'string' && data.startsWith('http')) {
        window.open(data, '_blank')
        return { success: true, redirect: true }
      }
      // HTML form response
      if (typeof data === 'string') {
        const div = document.createElement('div')
        div.innerHTML = data
        document.body.appendChild(div)
        const form = div.querySelector('form')
        if (form) form.submit()
        return { success: true, redirect: true }
      }
      return { success: true, redirect: false }
    } catch (e: any) {
      toast.error(e?.message || '支付失败，请重试')
      return { success: false, redirect: false }
    } finally {
      payLoading.value = false
    }
  }

  async function cancelAndClose(tradeNo?: string) {
    showPayModal.value = false
    if (tradeNo) {
      try { await orderApi.cancel(tradeNo) } catch { /* silent */ }
    }
  }

  function formatFee(method: PaymentMethod, amount: number): string {
    const fixed = method.handling_fee_fixed / 100
    const percent = (amount * method.handling_fee_percent) / 100 / 100
    const total = fixed + percent
    return total > 0 ? `+¥${total.toFixed(2)}` : ''
  }

  return {
    showPayModal,
    payMethods,
    currentTradeNo,
    payLoading,
    methodLoading,
    openPayment,
    confirmPay,
    cancelAndClose,
    formatFee,
  }
}
