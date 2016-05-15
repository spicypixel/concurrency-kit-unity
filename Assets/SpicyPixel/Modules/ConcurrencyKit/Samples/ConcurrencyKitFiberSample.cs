using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SpicyPixel.Threading;
using SpicyPixel.Threading.Tasks;

namespace SpicyPixel.Threading
{
    public class ConcurrencyKitFiberSample : ConcurrentBehaviour
    {
        string lastLogMessage = string.Empty;
        bool running = false;

        void Start ()
        {
            // Run some fibers in parallel and wait on them to finish.
            Log ("Starting concurrent fibers on scheduler " + fiberScheduler.GetType() + " ...");
            running = true;

            Fiber.WhenAll (new Fiber[] {
                RunWithConcurrentBehaviourScheduler (),
                RunWithSharedScheduler ()
            }, Timeout.Infinite, CancellationToken.None, fiberScheduler)
			.ContinueWith ((antecedent) => {
                Log ("Finished all concurrent tasks.");
                running = false;
            }, fiberScheduler);
        }

        // This method demonstrates running tasks using the ConcurrentBehaviour's scheduler.
        // These tasks are tied to the lifetime of the behaviour.
        Fiber RunWithConcurrentBehaviourScheduler ()
        {
            return fiberFactory.StartNew (() => {
                Log ("Starting a new fiber on the main Unity thread ...");
            }) // Uses the concurrent behaviour's scheduler
            .ContinueWith (WaitCoroutine (), fiberScheduler) // Uses the concurrent behaviour's scheduler
			.ContinueWith ((antecedent) => {
                Log ("Continued with another fiber on the main Unity thread after 2 seconds.");
            }, fiberScheduler) // Uses the concurrent behaviour's scheduler
            .ContinueWith (WaitCoroutine (), fiberScheduler) // Uses the concurrent behaviour's scheduler
			.ContinueWith ((antecedent) => {
                Log ("Continued with another fiber on the main Unity thread after 2 more seconds.");
            }, fiberScheduler); // Uses the concurrent behaviour's scheduler
        }

        // This method demonstrates starting a fiber using the shared scheduler.
        // The shared scheduler is valid for the lifetime of the app (until OnApplicationQuit).
        // The fiber that runs also happens to be a coroutine.
        Fiber RunWithSharedScheduler ()
        {
            return UnityFiberFactory.Default.StartNew (ExampleCoroutine ());
        }

        // This is an example coroutine.
        IEnumerator ExampleCoroutine ()
        {
            Log ("Starting ExampleCoroutine on the main Unity thread.");
            yield return new YieldForSeconds (2f);
            Log ("Finshed ExampleCoroutine in 2s.");
        }

        // Another coroutine to show running concurrently.
        IEnumerator WaitCoroutine ()
        {
            Log ("Waiting 2s on a Fiber of the main Unity thread ...");
            yield return new YieldForSeconds (2f);
        }

        void OnGUI ()
        {
            GUI.Label (new Rect (Screen.width / 2 - 200, Screen.height / 2 - 125, 400, 100), 
                "This example outputs information to the console. " +
                "It demonstrates how tasks can be chained together to run in sequence and how waits can be scheduled in a way that does not block the main Unity thread." +
                "The rotating cube shows the main thread continues to execute." +
                "The sample uses fibers and is suitable for web.");

            GUI.Label (new Rect (Screen.width / 2 - 200, Screen.height / 2 - 25, 400, 200), lastLogMessage);

            if (!running) {
                var again = GUI.Button (new Rect (Screen.width / 2 - 200, Screen.height / 2 + 175, 100, 40), "Run Again");
                if (again) {
                    lastLogMessage = string.Empty;
                    Start ();
                }
            }
        }

        void Log (string message)
        {
            var currentMessage = DateTime.Now.ToString ("HH:mm:ss.fff") + " " + message;
            lastLogMessage += currentMessage + "\n";
            Debug.Log (currentMessage);
        }
    }
}
