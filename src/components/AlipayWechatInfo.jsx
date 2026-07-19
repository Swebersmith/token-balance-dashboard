import { Smartphone } from 'lucide-react'

export default function AlipayWechatInfo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">支付宝 / 微信支付</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Alipay */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 text-center border border-emerald-100 dark:border-emerald-900/30">
          <div className="w-28 h-28 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center border border-emerald-100">
            <img
              src="/alipay-qr.png"
              alt="支付宝收款码"
              className="w-24 h-24 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-xs text-gray-400">
              请放置支付宝收款二维码图片
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">支付宝转账</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            扫码或转账至指定支付宝账号
          </p>
        </div>

        {/* WeChat */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 text-center border border-green-100 dark:border-green-900/30">
          <div className="w-28 h-28 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center border border-green-100">
            <img
              src="/wechat-qr.png"
              alt="微信收款码"
              className="w-24 h-24 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-xs text-gray-400">
              请放置微信收款二维码图片
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">微信转账</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            扫码或转账至指定微信账号
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        转账后请联系管理员确认，余额将在确认后更新到对应服务商账户
      </p>
    </div>
  )
}
