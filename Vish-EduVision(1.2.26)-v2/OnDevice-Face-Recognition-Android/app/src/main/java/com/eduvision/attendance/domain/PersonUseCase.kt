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
    ): Long =
        personDB.addPerson(
            PersonRecord(
                personName = name,
                studentClass = studentClass,
                rollNumber = rollNumber,
                numImages = numImages,
                addTime = System.currentTimeMillis(),
            ),
        )

    fun getPersonIDsByClass(studentClass: String): LongArray = personDB.getPersonIDsByClass(studentClass)

    fun getAllPersonsByClass(studentClass: String): List<PersonRecord> = personDB.getAllPersonsByClass(studentClass)

    fun getAllClasses(): List<String> = personDB.getAllClasses()

    fun removePerson(id: Long) {
        personDB.removePerson(id)
    }

    fun getAll(): Flow<List<PersonRecord>> = personDB.getAll()

    fun getCount(): Long = personDB.getCount()
}
