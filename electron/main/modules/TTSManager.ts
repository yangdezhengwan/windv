/**
 * Windows TTS 语音播报管理器
 * 使用 Windows SAPI 实现语音合成
 */

import { exec } from 'child_process';
import log from 'electron-log';

export class TTSManager {
  private static instance: TTSManager;
  private enabled: boolean = false;
  private rate: number = 0;  // 语速 -10 到 10
  private volume: number = 100;  // 音量 0 到 100
  private voice: string = 'Microsoft Yaqi';  // 默认中文语音

  private constructor() {
    log.info('TTSManager 初始化完成');
  }

  public static getInstance(): TTSManager {
    if (!TTSManager.instance) {
      TTSManager.instance = new TTSManager();
    }
    return TTSManager.instance;
  }

  /**
   * 设置 TTS 开关
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    log.info(`TTS 功能已${enabled ? '开启' : '关闭'}`);
  }

  /**
   * 设置语速
   */
  public setRate(rate: number): void {
    this.rate = Math.max(-10, Math.min(10, rate));
  }

  /**
   * 设置音量
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, volume));
  }

  /**
   * 语音播报
   */
  public async speak(text: string): Promise<void> {
    if (!this.enabled || !text) {
      return;
    }

    return new Promise((resolve, reject) => {
      // 使用 PowerShell 调用 Windows SAPI
      const escapedText = text.replace(/"/g, '`"').replace(/\n/g, ' ');
      const psCommand = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synth.Rate = ${this.rate};
        $synth.Volume = ${this.volume};
        $synth.Speak("${escapedText}");
      `;

      exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
        if (error) {
          log.error('TTS 播报失败:', error);
          reject(error);
        } else {
          log.info(`TTS 播报完成: ${text.substring(0, 20)}...`);
          resolve();
        }
      });
    });
  }

  /**
   * 停止播报
   */
  public stop(): void {
    log.info('TTS 停止播报');
  }

  /**
   * 获取可用语音列表
   */
  public async getVoices(): Promise<string[]> {
    return new Promise((resolve) => {
      const psCommand = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
      `;

      exec(`powershell -Command "${psCommand}"`, (error, stdout) => {
        if (error) {
          log.error('获取语音列表失败:', error);
          resolve([]);
        } else {
          const voices = stdout.trim().split('\n').filter(v => v.trim());
          resolve(voices);
        }
      });
    });
  }
}

export default TTSManager;
