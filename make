-- Grab the command-line arguments
local args = {...}
-- make friendly_name [ [ mod item meta slots count ] ... ]
-- make BasicCapacitor Forestry thermionicTubes 11 5 1 LapisTube ThermalFoundation material 106 2468 1 SignalumNugget BuildCraft|Silicon redstoneChipset 0 37 1 RedstoneChipset

--  1: friendly_name (BasicCapacitor) in CamelCase
local friendly_name = args[1]

-- If you are the ME INTERFACE, which direction is the turtle?
--  north, south, east, west, up, down
-- If you are the turtle, where is the ME CONTROLLER?
--  front, back, left, right, top, bottom
local i_dir = "left"
local facing = "east"
local c_dir = "front"
local controller = peripheral.wrap(c_dir)
local interface  = peripheral.wrap(i_dir)

-- A blank array to hold our crafting recipe(s)
local need = {}
local missing = {}

-- We will presume success unless there is a failure
local success = true

-- This function converts a crafting slot (1-9)
--  into the corresponding turtle slot (1-3,5-7,9-11)
function tslot(slot)
    slot = tonumber(slot)
    local rslot = slot
    if slot > 3 then rslot = rslot + 1 end
    if slot > 6 then rslot = rslot + 1 end
    return rslot
end

-- This function drops everything in the turtle
--  into the inventory in front of it (or on the
--  ground, I suppose, if there is no chest).
function dropall()
    turtle.turnLeft()
    for s=1,16 do
        if turtle.getItemCount(s) ~= 0 then
            turtle.select(s)
            turtle.drop()
        end
    end
    turtle.select(1)
    turtle.turnRight()
end

function string:split(delimiter)
  local result = { }
  local from  = 1
  local delim_from, delim_to = string.find( self, delimiter, from  )
  while delim_from do
    table.insert( result, string.sub( self, from , delim_from-1 ) )
    from  = delim_to + 1
    delim_from, delim_to = string.find( self, delimiter, from  )
  end
  table.insert( result, string.sub( self, from  ) )
  return result
end

function fill(qty,mod,item,meta,sl,name)
    local found = false
    local stacks = controller.getAvailableItems()
    for k,v in pairs(stacks) do
        x = v['fingerprint']
        if x then
            x.dmg = x.dmg or -1
            --print(mod..":"..item.."#"..meta)
            if mod..":"..item.."#"..meta == x.id.."#"..x.dmg then
                found = true
                --print(mod..":"..item.."#"..meta)
                --print(qty.." x "..name.." @ "..sl)
                --print("")
                -- local sl = tostring(v)
                local got = 0
                for z = 1,string.len(sl) do
                    local thisslot = tonumber(sl:sub(z,z))
                    local ts = tslot(thisslot)
                    if turtle.getItemCount(ts) == 0 then
                        --print(x.id..' '..facing..' '..qty..' '..ts)
                        local c={}
                        c.id = mod..":"..item
                        c.dmg = tonumber(meta) or -1
                        interface.exportItem(c,facing,qty,ts)

                        if turtle.getItemCount(ts) > 0 then
                            got = got + 1

                            print(thisslot..': '..x.id)

                        else
                            --print("! Need "..(qty*string.len(sl)-got).." "..name)
                            if missing[name] then
                                missing[name] = missing[name] + 1
                            else
                                missing[name] = 1
                            end
                            success = false
                            return success
                        end
                    end
                end
            end
        end
    end
    if not found then
        print("! Need "..(qty*string.len(sl)).." "..name)
        if missing[name] then
            missing[name] = missing[name] + 1
        else
            missing[name] = 1
        end
        success = false
    end
    return success
end

dropall()

local looping = true
local success = true

local argno = 2
local ingno = 1
while looping do
  local mod = args[argno]
  local item = args[argno+1]
  local meta = args[argno+2]
  local sl = args[argno+3]
  local qty = args[argno+4]
  local name = args[argno+5]
  if mod and item and meta and sl and qty then
    -- print("# "..friendly_name.."."..ingno)
    success = fill(qty,mod,item,meta,sl,name)
  else
    looping = false
  end
  --if not success then
    --looping = false
  --end
  argno = argno + 6
  ingno = ingno + 1
  sleep(0.01)
end

for k,v in pairs(missing) do
  print("Add "..v.." "..k)
end



if success then
        turtle.craft()
end
sleep(0.5)
dropall()

--// vim: set syntax=lua:
