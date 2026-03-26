export const serviceResources = {
  settings: {
    description: "Admin global settings and non-streaming settings sub-resources.",
    get: { method: "GET", path: "/api/v1/admin/settings" },
    update: { method: "PUT", path: "/api/v1/admin/settings" },
    actions: {
      test_smtp: { method: "POST", path: "/api/v1/admin/settings/test-smtp", description: "Test SMTP connectivity." },
      send_test_email: { method: "POST", path: "/api/v1/admin/settings/send-test-email", description: "Send a test email." },
      get_admin_api_key: { method: "GET", path: "/api/v1/admin/settings/admin-api-key", description: "Get the admin API key metadata or value payload." },
      regenerate_admin_api_key: { method: "POST", path: "/api/v1/admin/settings/admin-api-key/regenerate", description: "Regenerate the admin API key." },
      delete_admin_api_key: { method: "DELETE", path: "/api/v1/admin/settings/admin-api-key", description: "Delete the admin API key." },
      get_overload_cooldown: { method: "GET", path: "/api/v1/admin/settings/overload-cooldown", description: "Get overload cooldown settings." },
      update_overload_cooldown: { method: "PUT", path: "/api/v1/admin/settings/overload-cooldown", description: "Update overload cooldown settings." },
      get_stream_timeout: { method: "GET", path: "/api/v1/admin/settings/stream-timeout", description: "Get stream timeout settings." },
      update_stream_timeout: { method: "PUT", path: "/api/v1/admin/settings/stream-timeout", description: "Update stream timeout settings." },
      get_rectifier: { method: "GET", path: "/api/v1/admin/settings/rectifier", description: "Get request rectifier settings." },
      update_rectifier: { method: "PUT", path: "/api/v1/admin/settings/rectifier", description: "Update request rectifier settings." },
      get_beta_policy: { method: "GET", path: "/api/v1/admin/settings/beta-policy", description: "Get beta policy settings." },
      update_beta_policy: { method: "PUT", path: "/api/v1/admin/settings/beta-policy", description: "Update beta policy settings." },
      get_sora_s3: { method: "GET", path: "/api/v1/admin/settings/sora-s3", description: "Get Sora S3 settings." },
      update_sora_s3: { method: "PUT", path: "/api/v1/admin/settings/sora-s3", description: "Update Sora S3 settings." },
      test_sora_s3: { method: "POST", path: "/api/v1/admin/settings/sora-s3/test", description: "Test Sora S3 connectivity." },
      list_sora_s3_profiles: { method: "GET", path: "/api/v1/admin/settings/sora-s3/profiles", description: "List Sora S3 profiles." },
      create_sora_s3_profile: { method: "POST", path: "/api/v1/admin/settings/sora-s3/profiles", description: "Create a Sora S3 profile." },
      update_sora_s3_profile: { method: "PUT", path: "/api/v1/admin/settings/sora-s3/profiles/:profile_id", description: "Update a Sora S3 profile." },
      delete_sora_s3_profile: { method: "DELETE", path: "/api/v1/admin/settings/sora-s3/profiles/:profile_id", description: "Delete a Sora S3 profile." },
      activate_sora_s3_profile: { method: "POST", path: "/api/v1/admin/settings/sora-s3/profiles/:profile_id/activate", description: "Activate a Sora S3 profile." }
    }
  },
  data_management: {
    description: "Admin data management jobs, profiles, backups, and external storage settings.",
    actions: {
      agent_health: { method: "GET", path: "/api/v1/admin/data-management/agent/health", description: "Get data management agent health." },
      get_config: { method: "GET", path: "/api/v1/admin/data-management/config", description: "Get data management configuration." },
      update_config: { method: "PUT", path: "/api/v1/admin/data-management/config", description: "Update data management configuration." },
      list_source_profiles: { method: "GET", path: "/api/v1/admin/data-management/sources/:source_type/profiles", description: "List source profiles for a source type." },
      create_source_profile: { method: "POST", path: "/api/v1/admin/data-management/sources/:source_type/profiles", description: "Create a source profile." },
      update_source_profile: { method: "PUT", path: "/api/v1/admin/data-management/sources/:source_type/profiles/:profile_id", description: "Update a source profile." },
      delete_source_profile: { method: "DELETE", path: "/api/v1/admin/data-management/sources/:source_type/profiles/:profile_id", description: "Delete a source profile." },
      activate_source_profile: { method: "POST", path: "/api/v1/admin/data-management/sources/:source_type/profiles/:profile_id/activate", description: "Activate a source profile." },
      test_s3: { method: "POST", path: "/api/v1/admin/data-management/s3/test", description: "Test S3 settings." },
      list_s3_profiles: { method: "GET", path: "/api/v1/admin/data-management/s3/profiles", description: "List S3 profiles." },
      create_s3_profile: { method: "POST", path: "/api/v1/admin/data-management/s3/profiles", description: "Create an S3 profile." },
      update_s3_profile: { method: "PUT", path: "/api/v1/admin/data-management/s3/profiles/:profile_id", description: "Update an S3 profile." },
      delete_s3_profile: { method: "DELETE", path: "/api/v1/admin/data-management/s3/profiles/:profile_id", description: "Delete an S3 profile." },
      activate_s3_profile: { method: "POST", path: "/api/v1/admin/data-management/s3/profiles/:profile_id/activate", description: "Activate an S3 profile." },
      create_backup_job: { method: "POST", path: "/api/v1/admin/data-management/backups", description: "Create a data management backup job." },
      list_backup_jobs: { method: "GET", path: "/api/v1/admin/data-management/backups", description: "List data management backup jobs." },
      get_backup_job: { method: "GET", path: "/api/v1/admin/data-management/backups/:job_id", description: "Get a data management backup job." }
    }
  },
  backups: {
    description: "Admin backup storage, scheduling, backup lifecycle, and restore operations.",
    actions: {
      get_s3_config: { method: "GET", path: "/api/v1/admin/backups/s3-config", description: "Get backup S3 settings." },
      update_s3_config: { method: "PUT", path: "/api/v1/admin/backups/s3-config", description: "Update backup S3 settings." },
      test_s3_config: { method: "POST", path: "/api/v1/admin/backups/s3-config/test", description: "Test backup S3 settings." },
      get_schedule: { method: "GET", path: "/api/v1/admin/backups/schedule", description: "Get backup schedule settings." },
      update_schedule: { method: "PUT", path: "/api/v1/admin/backups/schedule", description: "Update backup schedule settings." },
      create_backup: { method: "POST", path: "/api/v1/admin/backups", description: "Create a backup." },
      list_backups: { method: "GET", path: "/api/v1/admin/backups", description: "List backups." },
      get_backup: { method: "GET", path: "/api/v1/admin/backups/:id", description: "Get a backup." },
      delete_backup: { method: "DELETE", path: "/api/v1/admin/backups/:id", description: "Delete a backup." },
      download_url: { method: "GET", path: "/api/v1/admin/backups/:id/download-url", description: "Get a backup download URL." },
      restore_backup: { method: "POST", path: "/api/v1/admin/backups/:id/restore", description: "Restore a backup." }
    }
  },
  system: {
    description: "Admin system version, updates, rollback, and restart operations.",
    actions: {
      version: { method: "GET", path: "/api/v1/admin/system/version", description: "Get current version metadata." },
      check_updates: { method: "GET", path: "/api/v1/admin/system/check-updates", description: "Check for available updates." },
      update: { method: "POST", path: "/api/v1/admin/system/update", description: "Perform a system update." },
      rollback: { method: "POST", path: "/api/v1/admin/system/rollback", description: "Rollback the current deployment." },
      restart: { method: "POST", path: "/api/v1/admin/system/restart", description: "Restart the service." }
    }
  }
}
