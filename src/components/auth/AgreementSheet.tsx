/**
 * AgreementSheet · 协议/隐私详情底部抽屉
 *
 * 用于展示《用户协议》《隐私政策》摘要内容，遵循项目现有 app 端样式规范。
 * 内容为占位文本（生产环境建议从 markdown/配置文件加载）。
 */
import { useEffect, useState } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface AgreementSheetProps {
  open: boolean;
  type: 'user' | 'privacy' | null;
  onClose: () => void;
}

const CONTENT = {
  user: {
    icon: FileText,
    title: '用户协议',
    sections: [
      {
        h: '一、服务说明',
        p: '智能记账（元答AI工作室出品）提供拍照 OCR 记账、商户自动归类、多账本、云同步、会员增值等个人记账服务，仅限合法用途。',
      },
      {
        h: '二、账号与安全',
        p: '请妥善保管账号密码，不得转借；发现异常立即修改密码并联系客服。',
      },
      {
        h: '三、行为规范（刑法红线）',
        p: '禁止利用本服务实施违法犯罪：不得出售/非法提供他人信息（《刑法》253条之一）、不得入侵或破坏平台系统（285/286条）、不得为诈骗等犯罪提供帮助（287条之二）。违者依法追责并终止服务。',
      },
      {
        h: '四、数据所有权',
        p: '你的账目数据归你所有，我们承诺不出售、不转让、不泄露。',
      },
      {
        h: '五、付费与会员',
        p: '会员自愿付费（月/季/年/终身档），核心记账免费、永无广告；一经售出非法律情形不退款。',
      },
      {
        h: '六、免责声明',
        p: '因不可抗力、网络故障、第三方服务中断或你操作不当导致的损失，我们在法律允许范围内免责；建议定期导出备份数据。',
      },
      {
        h: '七、协议变更与终止',
        p: '协议修订将在生效前通过应用内通知告知，继续使用即视为接受；你违约或违法时我们有权终止服务并依法追责。',
      },
    ],
  },
  privacy: {
    icon: ShieldCheck,
    title: '隐私政策',
    sections: [
      {
        h: '一、信息收集',
        p: '仅收集服务必需信息（注册邮箱、账目数据、客服反馈），不收集通讯录、位置等无关信息。',
      },
      {
        h: '二、数据不泄露承诺',
        p: '绝不出售、共享或公开披露你的数据，法律要求或你授权除外。内部访问须审批留痕，违规者依《刑法》253条之一追责；发生泄露将依法及时通知。',
      },
      {
        h: '三、存储与安全',
        p: '数据默认存储于你的设备本地。开启云同步后，数据经 TLS 加密传输至符合行业安全标准的云端环境，并按最小权限原则访问保护。你可在「设置 - 数据管理」查看同步状态，并可随时关闭同步或清空云端数据。',
      },
      {
        h: '四、相机权限',
        p: 'OCR 拍照仅在主动触发时调用，原图即拍即删、不持久化、不用于其他用途。',
      },
      {
        h: '五、第三方服务',
        p: 'OCR、云同步、支付等服务可能接入第三方，仅提供完成功能所必需的最少数据，并要求其履行同等保密义务。',
      },
      {
        h: '六、你的权利',
        p: '可随时查看、修改、删除数据，支持导出/清空；注销后 30 日内彻底删除。',
      },
      {
        h: '七、未成年人',
        p: '本服务面向年满 14 周岁用户；未满 18 周岁请在监护人同意下使用。',
      },
    ],
  },
} as const;

export function AgreementSheet({ open, type, onClose }: AgreementSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  if (!mounted || !type) return null;

  const c = CONTENT[type];
  const Icon = c.icon;

  return (
    <div
      className="absolute inset-0 z-[var(--z-modal)] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agreement-sheet-title"
    >
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="relative w-full max-h-[78%] rounded-t-[28px] bg-surface/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.18)] animate-[slideUp_0.34s_cubic-bezier(0.16,1,0.3,1)_forwards] overflow-hidden flex flex-col">
        {/* 顶栏 */}
        <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <Icon size={18} aria-hidden />
           </span>
            <h2 id="agreement-sheet-title" className="text-h3 text-text">
              {c.title}
           </h2>
         </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all duration-fast hover:bg-primary/10 hover:text-primary active:scale-95"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* 滚动内容 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 text-body leading-[1.75] text-text-secondary">
          <p className="mb-4 text-caption text-muted">
            最后更新：2026 年 8 月 · 元答AI工作室
         </p>
          {c.sections.map((s) => (
            <section key={s.h} className="mb-4">
              <h3 className="mb-1.5 text-h3 text-text">{s.h}</h3>
              <p>{s.p}</p>
           </section>
          ))}
          <p className="mt-6 rounded-xl bg-primary/5 p-3 text-caption text-primary">
            继续使用本服务即视为你已阅读并同意上述条款。如有疑问，可通过「我的 - 客服」联系我们。
         </p>
       </div>

        {/* 底部确认 */}
        <div className="shrink-0 border-t border-border/40 bg-surface/80 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-primary to-secondary text-white text-body font-medium shadow-[0_4px_18px_rgba(124,92,252,0.35)] transition-all duration-slow ease-spring hover:shadow-[0_6px_22px_rgba(124,92,252,0.5)] active:scale-[0.98]"
          >
            我已知晓
         </button>
       </div>
     </div>
   </div>
  );
}
