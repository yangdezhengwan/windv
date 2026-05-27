/**
 * 云端同步管理器
 * 实现多设备间的话术和数据同步
 */

import log from 'electron-log';
import axios, { AxiosInstance } from 'axios';

interface SyncConfig {
  apiUrl: string;
  token: string;
  clientId: string;
  autoSync: boolean;
  syncInterval: number; // 分钟
}

interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  errors: string[];
}

interface LocalScript {
  id: string;
  categoryId: string;
  keywords: string[];
  responses: string[];
  intentType: string;
  priority: number;
  aiEnabled: boolean;
  randomEnabled: boolean;
  matchMode: string;
  remark: string;
  isActive: boolean;
  updatedAt?: number;
}

export class CloudSyncManager {
  private static instance: CloudSyncManager;
  private api: AxiosInstance | null = null;
  private config: SyncConfig | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  private constructor() {
    log.info('CloudSyncManager 初始化');
  }

  public static getInstance(): CloudSyncManager {
    if (!CloudSyncManager.instance) {
      CloudSyncManager.instance = new CloudSyncManager();
    }
    return CloudSyncManager.instance;
  }

  /**
   * 初始化同步配置
   */
  public async init(config: SyncConfig): Promise<void> {
    this.config = config;
    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });

    // 加载本地配置
    await this.loadConfig();

    log.info('云端同步已初始化', { apiUrl: config.apiUrl });
  }

  /**
   * 加载同步配置
   */
  private async loadConfig(): Promise<void> {
    // 从本地存储加载配置
    const stored = localStorage.getItem('cloudSyncConfig');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
      } catch (e) {
        log.error('加载同步配置失败', e);
      }
    }
  }

  /**
   * 保存同步配置
   */
  private async saveConfig(): Promise<void> {
    if (this.config) {
      localStorage.setItem('cloudSyncConfig', JSON.stringify(this.config));
    }
  }

  /**
   * 设置自动同步
   */
  public setAutoSync(enabled: boolean, intervalMinutes: number = 30): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (enabled && this.config) {
      this.config.autoSync = enabled;
      this.config.syncInterval = intervalMinutes;
      this.saveConfig();

      // 设置定时同步
      this.syncTimer = setInterval(() => {
        this.sync();
      }, intervalMinutes * 60 * 1000);

      log.info(`自动同步已开启，间隔 ${intervalMinutes} 分钟`);
    }
  }

  /**
   * 执行同步
   */
  public async sync(): Promise<SyncResult> {
    if (this.isSyncing || !this.api || !this.config) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        errors: ['同步进行中或未初始化'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      uploaded: 0,
      downloaded: 0,
      errors: [],
    };

    try {
      log.info('开始云端同步...');

      // 1. 获取本地话术
      const localScripts = await this.getLocalScripts();

      // 2. 获取云端话术
      const cloudScripts = await this.fetchCloudScripts();

      // 3. 比较并合并
      const { toUpload, toDownload } = this.compareScripts(localScripts, cloudScripts);

      // 4. 上传本地新增/更新的话术
      if (toUpload.length > 0) {
        const uploadResult = await this.uploadScripts(toUpload);
        result.uploaded = uploadResult;
      }

      // 5. 下载云端新增/更新的话术
      if (toDownload.length > 0) {
        await this.downloadScripts(toDownload);
        result.downloaded = toDownload.length;
      }

      log.info(`同步完成: 上传 ${result.uploaded}, 下载 ${result.downloaded}`);

    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message || '同步失败');
      log.error('云端同步失败', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * 获取本地话术
   */
  private async getLocalScripts(): Promise<LocalScript[]> {
    // 这里需要通过 IPC 调用获取本地话术
    // 暂时返回空数组，实际通过 IPC 获取
    return [];
  }

  /**
   * 从云端获取话术
   */
  private async fetchCloudScripts(): Promise<LocalScript[]> {
    try {
      const response = await this.api!.get('/sync/scripts');
      return response.data.scripts || [];
    } catch (error: any) {
      log.error('获取云端话术失败', error);
      return [];
    }
  }

  /**
   * 比较话术，返回需要上传和下载的
   */
  private compareScripts(local: LocalScript[], cloud: LocalScript[]): {
    toUpload: LocalScript[];
    toDownload: LocalScript[];
  } {
    const toUpload: LocalScript[] = [];
    const toDownload: LocalScript[] = [];
    const cloudMap = new Map(cloud.map(s => [s.id, s]));

    // 检查本地话术
    for (const localScript of local) {
      const cloudScript = cloudMap.get(localScript.id);
      if (!cloudScript) {
        // 本地有，云端没有 -> 上传
        toUpload.push(localScript);
      } else if ((localScript.updatedAt || 0) > (cloudScript.updatedAt as any || 0)) {
        // 本地更新 -> 上传
        toUpload.push(localScript);
      }
    }

    // 检查云端话术
    for (const cloudScript of cloud) {
      const localScript = local.find(s => s.id === cloudScript.id);
      if (!localScript) {
        // 云端有，本地没有 -> 下载
        toDownload.push(cloudScript);
      } else if ((cloudScript.updatedAt as any || 0) > (localScript.updatedAt || 0)) {
        // 云端更新 -> 下载
        toDownload.push(cloudScript);
      }
    }

    return { toUpload, toDownload };
  }

  /**
   * 上传话术到云端
   */
  private async uploadScripts(scripts: LocalScript[]): Promise<number> {
    try {
      const response = await this.api!.post('/sync/scripts', {
        scripts,
        clientId: this.config?.clientId,
      });
      return response.data.results?.created + response.data.results?.updated || 0;
    } catch (error) {
      log.error('上传话术失败', error);
      return 0;
    }
  }

  /**
   * 下载话术到本地
   */
  private async downloadScripts(scripts: LocalScript[]): Promise<void> {
    // 这里需要通过 IPC 保存到本地数据库
    log.info(`下载 ${scripts.length} 条话术到本地`);
  }

  /**
   * 获取同步状态
   */
  public async getSyncStatus(): Promise<{
    enabled: boolean;
    lastSync: string | null;
    pending: number;
  }> {
    try {
      const response = await this.api!.get('/sync/status', {
        params: { clientId: this.config?.clientId },
      });
      return {
        enabled: this.config?.autoSync || false,
        lastSync: response.data.stats?.lastSyncAt || null,
        pending: response.data.stats?.totalScripts || 0,
      };
    } catch (error) {
      return {
        enabled: false,
        lastSync: null,
        pending: 0,
      };
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.api = null;
    this.config = null;
    log.info('云端同步已断开');
  }
}

export default CloudSyncManager;
