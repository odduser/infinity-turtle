function gof(n)
  local t = turtle
  local dir = "fd"
  local c
  for c = 1,n do
    if t.detect() then print("Block detected. Can't move.") return false end
    if t.attack() then print("Get out of my way!",1) return false end
    if not t.forward() then print("Could not move forward.") return false end
  end
end
function gob(n)
  local t = turtle
  local dir = "bk"
  local c
  for c = 1,n do
    if not t.back() then print("Could not move back.") return false end
  end
end
function gou(n)
  local t = turtle
  local dir = "up"
  local c
  for c = 1,n do
    if t.detectUp() then print("Detected block above") return false end
    if not t.up() then print("Could not move up") return false end
  end
end
function god(n)
  local t = turtle
  local dir = "dn"
  local c
  for c = 1,n do
    if t.detectDown() then print("Detected block below") return false end
    if not t.down() then print("Failed to go down") return false end
  end
end
function gol(n)
  local t = turtle
  local dir = "lt"
  for c = 1,n do
    t.turnLeft()
  end
end
function gor(n)
  local t = turtle
  local dir = "rt"
  for c = 1,n do
    t.turnRight()
  end
end

function go(dirs)
  local n = 1
  local bign = 0
  local l
  for l = 1, string.len(dirs) do
    local c = string.sub(dirs,l,l)
    if c == "(" then
      local i = 0
      n = 0
      local going = true
      while going == true do
        l = l + 1
        c = string.sub(dirs,l,l)
        if c == ")" then
                bign = n
                going = false
        else
                if c == "" then going = false end
                n = n * 10
                if c == "0" then n = n + 0 end
                if c == "1" then n = n + 1 end
                if c == "2" then n = n + 2 end
                if c == "3" then n = n + 3 end
                if c == "4" then n = n + 4 end
                if c == "5" then n = n + 5 end
                if c == "6" then n = n + 6 end
                if c == "7" then n = n + 7 end
                if c == "8" then n = n + 8 end
                if c == "9" then n = n + 9 end
        end
      end
    end

    if c == ")" then n = bign end
    if c == "." then n = 1 end
    if c == "0" then n = 0 end
    if c == "1" then n = 1 end
    if c == "2" then n = 2 end
    if c == "3" then n = 3 end
    if c == "4" then n = 4 end
    if c == "5" then n = 5 end
    if c == "6" then n = 6 end
    if c == "7" then n = 7 end
    if c == "8" then n = 8 end
    if c == "9" then n = 9 end

    --print("n = "..n.." l = "..l.." c = "..c)

    if c == "f" then gof(n) n = 1 end -- fd n
    if c == "b" then gob(n) n = 1 end -- bk n
    if c == "u" then gou(n) n = 1 end -- up n
    if c == "d" then god(n) n = 1 end -- dn n
    if c == "l" then gol(n) n = 1 end -- lt n
    if c == "r" then gor(n) n = 1 end -- rt n
    if c == "a" then gol(2) n = 1 end -- lt 2

    if c == "F" then gob(n) n = 1 end -- bk n
    if c == "B" then gof(n) n = 1 end -- fd n
    if c == "U" then god(n) n = 1 end -- dn n
    if c == "D" then gou(n) n = 1 end -- up n
    if c == "L" then gor(n) n = 1 end -- rt n
    if c == "R" then gol(n) n = 1 end -- lt n
    if c == "A" then gor(2) n = 1 end -- rt 2

  end
  return true
end

arg={...}
go(arg[1])