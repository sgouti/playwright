import { FullConfig } from '@playwright/test';
import { TEST_CONFIG } from '@config/test.config';
import { closeDatabaseConnection, getDatabase } from '@utils/DatabaseUtils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global teardown function that runs after all tests
 * Handles cleanup operations, database cleanup, and resource deallocation
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Cleanup database
    await cleanupDatabase();
    
    // Cleanup test artifacts
    await cleanupTestArtifacts();
    
    // Cleanup temporary files
    await cleanupTemporaryFiles();
    
    // Generate cleanup report
    await generateCleanupReport();
    
    // Close connections
    await closeConnections();
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

/**
 * Cleanup database and test data
 */
async function cleanupDatabase(): Promise<void> {
  console.log('🗄️ Cleaning up database...');
  
  try {
    const db = await getDatabase();
    
    // Clean up test data if configured to do so
    if (TEST_CONFIG.CLEANUP_TEST_DATA) {
      await db.cleanup();
      console.log('  Test data cleaned up');
    } else {
      console.log('  Test data cleanup skipped (CLEANUP_TEST_DATA = false)');
    }
    
    // Close database connection
    await closeDatabaseConnection();
    console.log('  Database connections closed');
  } catch (error) {
    console.warn('  Database cleanup failed:', error);
  }
}

/**
 * Cleanup test artifacts and old files
 */
async function cleanupTestArtifacts(): Promise<void> {
  console.log('📁 Cleaning up test artifacts...');
  
  try {
    // Clean up old screenshots (older than 7 days)
    await cleanupOldFiles(TEST_CONFIG.SCREENSHOT_PATH, 7);
    
    // Clean up old downloads
    await cleanupOldFiles(TEST_CONFIG.PATHS.DOWNLOADS, 3);
    
    // Clean up old logs
    if (TEST_CONFIG.LOG_TO_FILE) {
      await cleanupOldFiles(TEST_CONFIG.LOG_PATH, 14);
    }
    
    // Clean up failure screenshots older than 30 days
    const failureScreenshotPath = path.join(TEST_CONFIG.SCREENSHOT_PATH, 'failures');
    await cleanupOldFiles(failureScreenshotPath, 30);
    
    console.log('  Test artifacts cleaned up');
  } catch (error) {
    console.warn('  Test artifacts cleanup failed:', error);
  }
}

/**
 * Cleanup temporary files created during test execution
 */
async function cleanupTemporaryFiles(): Promise<void> {
  console.log('🗑️ Cleaning up temporary files...');
  
  try {
    const tempFiles = [
      path.join(TEST_CONFIG.PATHS.REPORTS, 'auth-tokens.json'),
      path.join(TEST_CONFIG.PATHS.REPORTS, 'storage-state.json'),
      path.join(TEST_CONFIG.PATHS.REPORTS, 'temp-setup.json'),
      path.join(TEST_CONFIG.PATHS.UPLOADS, 'temp-*'),
    ];
    
    for (const filePattern of tempFiles) {
      if (filePattern.includes('*')) {
        // Handle wildcard patterns
        const dir = path.dirname(filePattern);
        const pattern = path.basename(filePattern);
        
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const matchingFiles = files.filter(file => 
            file.startsWith(pattern.replace('*', ''))
          );
          
          for (const file of matchingFiles) {
            const filePath = path.join(dir, file);
            fs.unlinkSync(filePath);
            console.log(`  Removed temp file: ${file}`);
          }
        }
      } else {
        // Handle specific files
        if (fs.existsSync(filePattern)) {
          fs.unlinkSync(filePattern);
          console.log(`  Removed temp file: ${path.basename(filePattern)}`);
        }
      }
    }
    
    console.log('  Temporary files cleaned up');
  } catch (error) {
    console.warn('  Temporary files cleanup failed:', error);
  }
}

/**
 * Generate cleanup report
 */
async function generateCleanupReport(): Promise<void> {
  console.log('📊 Generating cleanup report...');
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.TEST_ENV || 'dev',
      cleanupActions: [],
      statistics: {
        screenshotsRemoved: 0,
        downloadsRemoved: 0,
        logsRemoved: 0,
        tempFilesRemoved: 0,
      },
      errors: [],
    };
    
    // Count files in various directories
    report.statistics.screenshotsRemoved = await countFilesInDirectory(TEST_CONFIG.SCREENSHOT_PATH);
    report.statistics.downloadsRemoved = await countFilesInDirectory(TEST_CONFIG.PATHS.DOWNLOADS);
    report.statistics.logsRemoved = await countFilesInDirectory(TEST_CONFIG.LOG_PATH);
    
    // Add cleanup actions
    report.cleanupActions.push('Database connections closed');
    report.cleanupActions.push('Test data cleaned up');
    report.cleanupActions.push('Old screenshots removed');
    report.cleanupActions.push('Temporary files removed');
    
    // Save report
    const reportPath = path.join(TEST_CONFIG.PATHS.REPORTS, 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  Cleanup report saved: ${reportPath}`);
  } catch (error) {
    console.warn('  Failed to generate cleanup report:', error);
  }
}

/**
 * Close all connections and resources
 */
async function closeConnections(): Promise<void> {
  console.log('🔌 Closing connections...');
  
  try {
    // Database connections are already closed in cleanupDatabase()
    
    // Close any other connections (Redis, message queues, etc.)
    // This is where you would close other service connections
    
    console.log('  All connections closed');
  } catch (error) {
    console.warn('  Failed to close some connections:', error);
  }
}

/**
 * Clean up old files in a directory
 */
async function cleanupOldFiles(dirPath: string, daysOld: number): Promise<number> {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  let removedCount = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        removedCount++;
        console.log(`  Removed old file: ${file}`);
      }
    }
  } catch (error) {
    console.warn(`  Failed to cleanup files in ${dirPath}:`, error);
  }
  
  return removedCount;
}

/**
 * Count files in a directory
 */
async function countFilesInDirectory(dirPath: string): Promise<number> {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    return files.filter(file => {
      const filePath = path.join(dirPath, file);
      return fs.statSync(filePath).isFile();
    }).length;
  } catch (error) {
    console.warn(`Failed to count files in ${dirPath}:`, error);
    return 0;
  }
}

/**
 * Archive test results for long-term storage
 */
async function archiveTestResults(): Promise<void> {
  console.log('📦 Archiving test results...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(TEST_CONFIG.PATHS.REPORTS, 'archives', timestamp);
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    // Archive important files
    const filesToArchive = [
      'test-results/results.json',
      'test-results/results.xml',
      'playwright-report/index.html',
    ];
    
    for (const file of filesToArchive) {
      const sourcePath = path.join(process.cwd(), file);
      const destPath = path.join(archiveDir, path.basename(file));
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  Archived: ${file}`);
      }
    }
    
    console.log(`  Test results archived to: ${archiveDir}`);
  } catch (error) {
    console.warn('  Failed to archive test results:', error);
  }
}

/**
 * Send cleanup notifications (if configured)
 */
async function sendCleanupNotifications(): Promise<void> {
  console.log('📧 Sending cleanup notifications...');
  
  try {
    // This is where you would send notifications to Slack, email, etc.
    // For now, just log the completion
    
    const summary = {
      timestamp: new Date().toISOString(),
      environment: process.env.TEST_ENV || 'dev',
      status: 'completed',
      message: 'Test cleanup completed successfully',
    };
    
    console.log('  Cleanup summary:', JSON.stringify(summary, null, 2));
    
    // In a real implementation, you might:
    // - Send Slack notification
    // - Send email report
    // - Update monitoring dashboard
    // - Log to external service
    
  } catch (error) {
    console.warn('  Failed to send cleanup notifications:', error);
  }
}

/**
 * Emergency cleanup function for critical failures
 */
export async function emergencyCleanup(): Promise<void> {
  console.log('🚨 Performing emergency cleanup...');
  
  try {
    // Force close database connections
    await closeDatabaseConnection();
    
    // Remove lock files
    const lockFiles = [
      path.join(process.cwd(), '.test-lock'),
      path.join(TEST_CONFIG.PATHS.REPORTS, 'test.lock'),
    ];
    
    for (const lockFile of lockFiles) {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        console.log(`  Removed lock file: ${lockFile}`);
      }
    }
    
    // Kill any hanging processes (if needed)
    // This would be platform-specific implementation
    
    console.log('  Emergency cleanup completed');
  } catch (error) {
    console.error('  Emergency cleanup failed:', error);
  }
}

/**
 * Validate cleanup completion
 */
async function validateCleanup(): Promise<boolean> {
  console.log('✅ Validating cleanup completion...');
  
  try {
    // Check that temporary files are removed
    const tempFiles = [
      path.join(TEST_CONFIG.PATHS.REPORTS, 'auth-tokens.json'),
      path.join(TEST_CONFIG.PATHS.REPORTS, 'storage-state.json'),
    ];
    
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        console.warn(`  Temp file still exists: ${file}`);
        return false;
      }
    }
    
    // Check that database connections are closed
    // This would depend on your database implementation
    
    console.log('  Cleanup validation passed');
    return true;
  } catch (error) {
    console.warn('  Cleanup validation failed:', error);
    return false;
  }
}

export default globalTeardown;