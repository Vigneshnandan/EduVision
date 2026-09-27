/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.koin.core.annotation.Single

/**
 * Manages encrypted persistence for teacher authentication sessions and token caches.
 * Uses EncryptedSharedPreferences (AES256-GCM) so no raw session secrets or credentials
 * sit in plaintext on-device storage. Raw passwords are never stored.
 */
@Single
class EncryptedSessionStore(context: Context) {

    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "eduvision_secure_session",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_SESSION_TOKEN = "session_token"
        private const val KEY_TEACHER_REMOTE_ID = "teacher_remote_id"
        private const val KEY_TEACHER_NAME = "teacher_name"
        private const val KEY_TEACHER_LOGIN_ID = "teacher_login_id"
        private const val KEY_SCHOOL_ID = "school_id"
        private const val KEY_SCHOOL_NAME = "school_name"
        private const val KEY_LAST_LOGIN_TIME = "last_login_time"
        private const val KEY_CACHED_SCHOOLS_JSON = "cached_schools_json"
        private const val KEY_SCHOOLS_CACHE_TIME = "schools_cache_time"
    }

    fun saveSession(
        sessionToken: String,
        teacherRemoteId: String,
        teacherName: String,
        teacherLoginId: String,
        schoolId: String,
        schoolName: String,
        lastLoginTime: Long = System.currentTimeMillis()
    ) {
        prefs.edit {
            putString(KEY_SESSION_TOKEN, sessionToken)
            putString(KEY_TEACHER_REMOTE_ID, teacherRemoteId)
            putString(KEY_TEACHER_NAME, teacherName)
            putString(KEY_TEACHER_LOGIN_ID, teacherLoginId)
            putString(KEY_SCHOOL_ID, schoolId)
            putString(KEY_SCHOOL_NAME, schoolName)
            putLong(KEY_LAST_LOGIN_TIME, lastLoginTime)
        }
    }

    fun getSessionToken(): String? = prefs.getString(KEY_SESSION_TOKEN, null)

    fun getTeacherRemoteId(): String? = prefs.getString(KEY_TEACHER_REMOTE_ID, null)

    fun getTeacherName(): String? = prefs.getString(KEY_TEACHER_NAME, null)

    fun getTeacherLoginId(): String? = prefs.getString(KEY_TEACHER_LOGIN_ID, null)

    fun getSchoolId(): String? = prefs.getString(KEY_SCHOOL_ID, null)

    fun getSchoolName(): String? = prefs.getString(KEY_SCHOOL_NAME, null)

    fun getLastLoginTime(): Long = prefs.getLong(KEY_LAST_LOGIN_TIME, 0L)

    fun hasValidSession(): Boolean {
        val token = getSessionToken()
        return !token.isNullOrBlank()
    }

    fun clearSession() {
        prefs.edit {
            remove(KEY_SESSION_TOKEN)
            remove(KEY_TEACHER_REMOTE_ID)
            remove(KEY_TEACHER_NAME)
            remove(KEY_TEACHER_LOGIN_ID)
            remove(KEY_SCHOOL_ID)
            remove(KEY_SCHOOL_NAME)
            remove(KEY_LAST_LOGIN_TIME)
        }
    }

    fun saveCachedSchools(schoolsJson: String) {
        prefs.edit {
            putString(KEY_CACHED_SCHOOLS_JSON, schoolsJson)
            putLong(KEY_SCHOOLS_CACHE_TIME, System.currentTimeMillis())
        }
    }

    fun getCachedSchools(): String? = prefs.getString(KEY_CACHED_SCHOOLS_JSON, null)

    fun getSchoolsCacheTime(): Long = prefs.getLong(KEY_SCHOOLS_CACHE_TIME, 0L)
}
