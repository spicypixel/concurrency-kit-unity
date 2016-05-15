using UnityEngine;
using System;
using System.Collections;
using System.Threading;
using System.Threading.Tasks;
using SpicyPixel.Threading;
using SpicyPixel.Threading.Tasks;

namespace SpicyPixel.Threading
{
    public class ConcurrencyKitThreadingSample : ConcurrentBehaviour
    {
        string lastLogMessage = string.Empty;
        bool running = false;

        void Start ()
        {
            // Run some tasks in parallel and wait on them to finish.
            Log ("Starting concurrent tasks ...");
            running = true;
            Task.WhenAll (
                RunWithConcurrentBehaviourScheduler (),
                RunWithSharedScheduler ())
			.ContinueWith ((t) => {
                Log ("Finished all concurrent tasks.");
                running = false;
            });
        }

        // This method demonstrates running tasks using the ConcurrentBehaviour's scheduler.
        // These tasks are tied to the lifetime of the behaviour.
        Task RunWithConcurrentBehaviourScheduler ()
        {
            return taskFactory.StartNew (() => {
                Log ("Starting a new task on the main Unity thread ...");
            }) // Uses the concurrent behaviour's scheduler
			.ContinueWith ((antecedent) => {
                Log ("Waiting 2s on a thread pool thread ...");
                Thread.Sleep (2000);
            }) // Uses the default thread pool scheduler
			.ContinueWith ((antecedent) => {
                Log ("Continued with another task on the main Unity thread after 2 seconds.");
            }, taskScheduler) // Uses the concurrent behaviour's scheduler
			.ContinueWith ((antecedent) => {
                Log ("Waiting 2s on a thread pool thread ...");
                Thread.Sleep (2000);
            }) // Uses the default thread pool scheduler
			.ContinueWith ((antecedent) => {
                Log ("Continued with another task on the main Unity thread after 2 more seconds.");
            }, taskScheduler); // Uses the concurrent behaviour's scheduler
        }

        // This method demonstrates starting a task using the shared scheduler.
        // The shared scheduler is valid for the lifetime of the app (until OnApplicationQuit).
        // The task that runs also happens to be a coroutine.
        Task RunWithSharedScheduler ()
        {
            return UnityTaskFactory.Default.StartNew (ExampleCoroutine ());
        }

        // This is an example coroutine.
        IEnumerator ExampleCoroutine ()
        {
            Log ("Starting ExampleCoroutine on the main Unity thread.");
            yield return new YieldForSeconds (2f);
            Log ("Finshed ExampleCoroutine in 2s.");
        }

        void OnGUI ()
        {                
            GUI.Label (new Rect (Screen.width / 2 - 200, Screen.height / 2 - 50, 400, 100), 
                "This example outputs information to the console. " +
                "It demonstrates how tasks can be chained together to run in sequence and how a blocking call like Thread.Sleep() can be scheduled so that it does not block the main Unity thread." +
                "The rotating cube shows the main thread continues to execute." +
                "The sample uses threads so is not suitable for web; see the Fiber sample instead.");

            GUI.Label (new Rect (Screen.width / 2 - 200, Screen.height / 2 + 50, 400, 200), lastLogMessage);

            if (!running) {
                var again = GUI.Button (new Rect (Screen.width / 2 - 200, Screen.height / 2 + 250, 100, 40), "Run Again");
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
