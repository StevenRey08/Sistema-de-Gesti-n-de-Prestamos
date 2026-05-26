Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

basePath = FSO.GetParentFolderName(WScript.ScriptFullName)
backendPath = basePath & "\backend"
frontendPath = basePath & "\frontend"

Function IsPortOpen(port)
    On Error Resume Next
    Set req = CreateObject("WinHttp.WinHttpRequest.5.1")
    req.Open "GET", "http://localhost:" & port, False
    req.SetTimeouts 2000, 2000, 2000, 2000
    req.Send ""
    IsPortOpen = (req.Status = 200)
    Set req = Nothing
    On Error Goto 0
End Function

If Not IsPortOpen("3000") Then
    WshShell.Run "cmd /c cd /d """ & backendPath & """ && npm run dev", 0, False
    WshShell.Run "cmd /c cd /d """ & frontendPath & """ && npx next dev -p 3000", 0, False
End If

WshShell.Run "http://localhost:3000"
