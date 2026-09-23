/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.domain

import com.eduvision.attendance.data.PersonDB
import com.eduvision.attendance.data.PersonRecord
import kotlinx.coroutines.flow.Flow
import org.koin.core.annotation.Single

@Single
class PersonUseCase(
    private val personDB: PersonDB,
) {
    fun addPerson(
        name: String,
        studentClass: String,
        rollNumber: String,
        numImages: Long,
        schoolId: String = "",
        pendingStudentSync: Boolean = false,
    ): Long =
        personDB.addPerson(
            PersonRecord(
                personName = name,
                studentClass = studentClass,
                rollNumber = rollNumber,
                numImages = numImages,
                addTime = System.currentTimeMillis(),
                schoolId = schoolId,
                pendingStudentSync = pendingStudentSync,
            ),
        )

    fun getPerson(id: Long): PersonRecord? = personDB.getPerson(id)

    fun updatePerson(person: PersonRecord) {
        personDB.updatePerson(person)
    }

    fun getPendingSyncStudents(): List<PersonRecord> = personDB.getPendingSyncStudents()

    fun getPersonIDsByClass(studentClass: String): LongArray = personDB.getPersonIDsByClass(studentClass)

    fun getAllPersonsByClass(studentClass: String): List<PersonRecord> = personDB.getAllPersonsByClass(studentClass)

    fun getAllClasses(): List<String> = personDB.getAllClasses()

    fun removePerson(id: Long) {
        personDB.removePerson(id)
    }

    fun getAll(): Flow<List<PersonRecord>> = personDB.getAll()

    fun getCount(): Long = personDB.getCount()
}

