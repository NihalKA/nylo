package expo.modules.nylobackgroundresponse

import org.junit.Assert.*
import org.junit.Test

class ResponseLeasesTest {
  @Test fun cancellationBeforeServiceStartupCannotGrantTheStoppedResponse() {
    val leases = ResponseLeases()
    val answers = mutableListOf<Boolean>()
    leases.add("a", { answers.add(it) }, { fail("Cancelled response expired") })
    leases.release("a")
    leases.grant()
    assertEquals(listOf(false), answers)
    assertEquals(0, leases.size)
  }

  @Test fun concurrentResponsesKeepIndependentOwnershipAndExpiration() {
    val leases = ResponseLeases()
    val answers = mutableListOf<String>()
    val expired = mutableListOf<String>()
    leases.add("a", { answers.add("a:$it") }, { expired.add("a") })
    leases.add("b", { answers.add("b:$it") }, { expired.add("b") })
    leases.grant()
    leases.release("a")
    leases.expire("a")
    assertEquals(listOf("b"), leases.tokens)
    leases.grant()
    leases.expire("b")
    leases.expire("b")
    assertEquals(listOf("a:true", "b:true"), answers)
    assertEquals(listOf("b"), expired)
    assertEquals(0, leases.size)
  }

  @Test fun duplicateTokenCannotReplaceTheFirstOwnersCallbacks() {
    val leases = ResponseLeases()
    val answers = mutableListOf<Boolean>()
    assertTrue(leases.add("a", { answers.add(it) }, {}))
    assertFalse(leases.add("a", { fail("Duplicate got a grant") }, {}))
    leases.grant()
    assertEquals(listOf(true), answers)
  }

  @Test fun expirationWhileStartupIsPendingCannotBecomeALateGrant() {
    val leases = ResponseLeases()
    val answers = mutableListOf<Boolean>()
    var expired = 0
    leases.add("a", { answers.add(it) }, { expired++ })
    leases.expire("a")
    leases.grant()
    assertEquals(listOf(false), answers)
    assertEquals(1, expired)
  }
}
