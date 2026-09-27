/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

package com.eduvision.attendance.data

import io.objectbox.kotlin.flow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOn
import org.koin.core.annotation.Single

@Single
class PersonDB {
    private val personBox = ObjectBoxStore.store.boxFor(PersonRecord::class.java)

    fun addPerson(person: PersonRecord): Long = personBox.put(person)

    fun getPerson(personID: Long): PersonRecord? = personBox.get(personID)

    fun updatePerson(person: PersonRecord) {
        personBox.put(person)
    }

    fun removePerson(personID: Long) {
        personBox.removeByIds(listOf(personID))
    }

    // Returns the number of records present in the collection
    fun getCount(): Long = personBox.count()

    @OptIn(ExperimentalCoroutinesApi::class)
    fun getAll(): Flow<MutableList<PersonRecord>> =
        personBox
            .query(PersonRecord_.personID.notNull())
            .build()
            .flow()
            .flowOn(Dispatchers.IO)

    fun getPersonIDsByClass(studentClass: String): LongArray {
        return personBox.query(PersonRecord_.studentClass.equal(studentClass))
            .build()
            .findIds()
    }

    fun getAllPersonsByClass(studentClass: String): List<PersonRecord> {
        return personBox.query(PersonRecord_.studentClass.equal(studentClass))
            .build()
            .find()
    }

    fun getPendingSyncStudents(): List<PersonRecord> {
        return personBox.query(PersonRecord_.pendingStudentSync.equal(true))
            .build()
            .find()
    }

    fun getAllClasses(): List<String> {
        return personBox.query()
            .build()
            .property(PersonRecord_.studentClass)
            .distinct()
            .findStrings()
            .toList()
            .filter { it.isNotEmpty() }
            .sorted()
    }
}

